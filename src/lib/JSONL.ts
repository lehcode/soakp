import jsonlines from 'jsonlines';
import { camelCase, startCase } from 'lodash';
import { bindNodeCallback, from, map, Observable, of } from 'rxjs';
import { mergeMap, toArray } from 'rxjs/operators';
import path from 'path';
import { serverConfig } from '../configs';
import fs, { promises } from 'fs';
import Stream, { Readable } from 'stream';
import { TypescriptParser } from 'typescript-parser';
import readline from 'readline';
import { Project, ScriptKind, SourceFile, Node, SyntaxKind, ParameterDeclaration } from 'ts-morph';

type CodeAndComment = { code: string; comment: string };

export interface JsonlLineInterface {
  code: string;
  completion: string;
}

export class JSONL {
  /**
   * jsonlines parser instance
   *
   * @private
   */
  private readonly jsonlParserService: jsonlines.Parser;

  /**
   * jsonlines stringifier instance
   *
   * @private
   */
  private readonly jsonlStringifierService: jsonlines.Stringifier;

  private readonly typescriptParser: TypescriptParser;

  /**
   * @constructor
   */
  constructor() {
    this.jsonlParserService = jsonlines.parse();
    this.jsonlStringifierService = jsonlines.stringify();
    this.typescriptParser = new TypescriptParser();
  }

  /**
   * @return {jsonlines.Parser}
   */
  private get parser(): jsonlines.Parser {
    return this.jsonlParserService;
  }

  /**
   * @return {jsonlines.Stringifier}
   */
  private get stringifier(): jsonlines.Stringifier {
    return this.jsonlStringifierService;
  }

  /**
   * Cleanup text for AI model
   *
   * @param line
   */
  static cleanup(line: string) {
    return line.replace(/^\s+/, '');
  }

  /**
   * Parse TypeScript code and comments. Return value is an Object{ code: <code>, comment: <preceding comment> }
   *
   * @param file
   */
  async parseTypescriptFile(file: Express.Multer.File): Promise<JsonlLineInterface> {
    try {
      const code = file.buffer.toString('utf-8');
      const project = new Project();
      const sourceFile: SourceFile = project.createSourceFile('temp.ts', code);

      let concatenatedCode = '';
      let completion = '';

      // Regular expressions to detect multi-line comments and JSDoc comments
      const multiLineCommentRegex = /\/\*[^]*?\*\//g;
      const jsDocCommentRegex = /\/\*\*[^]*?\*\//g;

      const recursiveParse = async (node: Node) => {
        // Handling JSDoc comments
        if (Node.isJSDoc(node)) {
          const jsDocText = node.getText().replace(/[\r\n\t\/\*]/g, ' ')
            .replace(/\s+/g, ' ');
          completion += jsDocText;
        }

        // Handling comments (multi-line and single-line)
        if (Node.isCommentNode(node) && !Node.isJSDoc(node)) {
          const commentText = node.getText().replace(/\r\n|\r|\n|\t/g, ' ');
          // Check if the comment is multi-line
          if (multiLineCommentRegex.test(commentText)) {
            completion += commentText.replace(multiLineCommentRegex, ' ');
          } else {
            completion += commentText;
          }
        }

        // Handling imports
        if (Node.isImportDeclaration(node)) {
          const namedImports = node.getNamedImports();
          const importClause = node.getImportClause();
          const importNames = [];
          const imports = [];

          if (importClause) {
            const defaultImport = importClause.getDefaultImport();
            const namespaceImport = importClause.getNamespaceImport();

            if (defaultImport) {
              const defaultImportText = defaultImport.getText();
              importNames.push(defaultImportText);
            }

            if (namespaceImport) {
              const namespaceImportText = namespaceImport.getText();
              importNames.push(namespaceImportText);
            }
          }

          if (namedImports.length > 0) {
            for (const namedImport of namedImports) {
              const importName = namedImport.getText();
              importNames.push(importName);
            }
            // Concatenate multiple imports into a single string
            const concatenatedImports = importNames.join(', ');
            concatenatedCode += concatenatedImports;

            return { code: `${concatenatedCode}\n\n###\n\n`, completion: 'TypeScript import END' };
          }
        }

        // Handling functions, getters, setters, or similar properties
        if (
          Node.isFunctionDeclaration(node) ||
          Node.isGetAccessorDeclaration(node) ||
          Node.isSetAccessorDeclaration(node)
        ) {
          const methodName = node.getName();
          const parameters = node.getParameters();

          // Invoke parseTypescriptMethod and concatenate the result to the code
          const parsedParams = await this.parseTypescriptMethod(methodName, parameters);
          parsedParams.forEach((parsedParam) => {
            concatenatedCode += `\n${methodName}(${parsedParam.paramName}: ${parsedParam.parsedTypeName})`;
            if (parsedParam.jsdocDescription) {
              completion += `${parsedParam.jsdocDescription} `;
            }
          });
        }

        // Recursive parsing
        if (node.getChildCount() > 0) {
          for (const childNode of node.getChildren()) {
            await recursiveParse(childNode);
          }
        } else {
          // If node is not an import or a comment, collect code line by line
          if (!Node.isImportDeclaration(node) && !Node.isCommentNode(node) && !Node.isJSDoc(node)) {
            const codeLine = node.getText().replace(/\r\n|\r|\n|\t/g, ' ');
            concatenatedCode += `${codeLine} `;
          }
        }
      };

      await recursiveParse(sourceFile);

      return { code: concatenatedCode, completion };
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  async parseTypescriptMethod(methodName: string, parameters: ParameterDeclaration[]) {
    const parsedParams = [];
    for (const param of parameters) {
      const paramName = param.getName();
      const typeNode = param.getTypeNode();
      const parsedTypeName = typeNode ? startCase(camelCase(typeNode.getText())) : null;

      const jsDocs = param.getParentIfKindOrThrow(SyntaxKind.FunctionDeclaration).getJsDocs();
      let jsdocDescription = null;
      if (jsDocs.length > 0) {
        const paramTag = jsDocs[0].getTags()[0];
        if (paramTag) {
          jsdocDescription = paramTag.getComment();
        }
      }

      parsedParams.push({ paramName, parsedTypeName, jsdocDescription });
    }
    return parsedParams;
  }

  // /**
  //  * Concatenate array of files into single JSONL file suitable for OpenAI model fine-tuning
  //  *
  //  * @param txtFiles
  //  * @param concatBaseName?
  //  */
  // async concatTxt2Jsonlines(
  //   txtFiles: Express.Multer.File[] | { [p: string]: Express.Multer.File[] },
  //   concatBaseName?: string
  // ) {
  //   return new Promise<Express.Multer.File>((resolve, reject) => {
  //     try {
  //       const jsonlFileName = concatBaseName || `concat-${Date.now()}.jsonl`;
  //       const jsonlFilePath = path.resolve(
  //         `${serverConfig.dataDir}/jsonl/${jsonlFileName}`
  //       );
  //       const writeStream = fs.createWriteStream(jsonlFilePath);
  //       // const stringify = this.stringifierService;
  //
  //       this.jsonlStringifierService.pipe(writeStream);
  //
  //       const txtFilesArray = Array.isArray(txtFiles) ? txtFiles : Object.values(txtFiles);
  //
  //       from(txtFilesArray).pipe(
  //         // @ts-ignore
  //         mergeMap((txtFile: Express.Multer.File, index: number) => {
  //           const buffer = Buffer.from(txtFile.buffer);
  //           const readableStream = new Readable();
  //           readableStream.push(buffer);
  //           readableStream.push(null);
  //
  //           return this.readableStreamToObservable(readableStream).pipe(
  //             mergeMap((lineBuffer: Buffer) => {
  //               const line = lineBuffer.toString('utf8');
  //               if (line.trim() !== '') {
  //                 const cleanedLine = JSONL.cleanup(line);
  //                 return bindNodeCallback(this.jsonlStringifierService.write.bind(this.jsonlStringifierService))({
  //                   prompt: `${cleanedLine}\n\n###\n\n`,
  //                   completion: ` ${completions[index]} END`
  //                 });
  //               }
  //             })
  //           );
  //         })
  //       )
  //         .subscribe({
  //           complete: () => {
  //             this.jsonlStringifierService.end();
  //           },
  //           error: (err) => {
  //             console.log(err);
  //             reject(err);
  //           }
  //         });
  //
  //       writeStream.on('finish', async () => {
  //         console.log(`Done concatenating files to ${jsonlFileName}`);
  //
  //         try {
  //           const jsonlData = await promises.readFile(jsonlFilePath);
  //           // @ts-ignore
  //           const concatenatedFile: Express.Multer.File = {
  //             ...txtFilesArray[0],
  //             mimetype: 'application/json',
  //             originalname: jsonlFileName,
  //             buffer: jsonlData,
  //             path: jsonlFilePath
  //           };
  //           resolve(concatenatedFile);
  //         } catch (err) {
  //           reject(err);
  //         }
  //       });
  //     } catch (err: any) {
  //       reject(err);
  //     }
  //   });
  // }

  // /**
  //  *
  //  * @param readStream
  //  */
  // readableStreamToObservable(readStream: NodeJS.ReadableStream): Observable<Buffer> {
  //   return from(readStream).pipe(
  //     mergeMap((chunk: Buffer | string | null) => {
  //       if (chunk === null) {
  //         // Signal the end of the stream
  //         return;
  //       } else if (Buffer.isBuffer(chunk)) {
  //         return [chunk];
  //       } else if (typeof chunk === 'string') {
  //         return [Buffer.from(chunk, 'utf8')];
  //       } else {
  //         throw new Error('Unsupported chunk type.');
  //       }
  //     })
  //   );
  // }

  /**
   *
   * @param txtFile
   * @param completion
   */
  async txt2Jsonlines(txtFile: Record<string, any>, completion: string): Promise<Record<string, string>> {
    return new Promise((resolve, reject) => {
      try {
        const buffer = Buffer.from(txtFile.buffer);
        const basename = path.basename(txtFile.originalname);
        const readableStream = new Stream.Readable();
        readableStream.push(buffer);
        readableStream.push(null);

        const jsonlFilePath = path.resolve(`${serverConfig.dataDir}/jsonl/${basename}.jsonl`);
        const writeStream = fs.createWriteStream(jsonlFilePath);
        const stringify = jsonlines.stringify();

        const readStream = readline.createInterface({
          input: readableStream,
          output: process.stdout,
          terminal: false
        });

        stringify.pipe(process.stdout);
        stringify.pipe(writeStream);
        let lineNumber = 0;

        readStream.on('line', (line) => {
          lineNumber++;
          if (line !== '') {
            const cleanLine = line.replace(/^\s+/, '');

            // Convert the line to a JSON object
            stringify.write({ prompt: `${cleanLine}\\n\\n###\\n\\n`, completion: ` ${completion} END` }, (err) => {
              if (err) {
                reject(err);
              }
            });
          }
        });

        readStream.on('close', () => {
          // Signal the end of the stringify stream
          stringify.end();
        });

        writeStream.on('finish', () => {
          console.log('Done converting buffer to .jsonl');

          new Promise(async () => {
            const jsonlData = await fs.promises.readFile(jsonlFilePath, 'utf8');
            resolve({
              file: jsonlFilePath,
              data: jsonlData
            });
          });
        });
      } catch (err: any) {
        reject(err);
      }
    });
  }

  /**
   * Concatenate array of files into single JSONL file suitable for OpenAI mdodel fine-tuning
   *
   * @param txtFiles
   * @param completions
   * @param concatBaseName?
   */
  async concatTxt2Jsonlines(txtFiles: Express.Multer.File[], completions?: string[], concatBaseName?: string) {
    return new Promise<Express.Multer.File>((resolve, reject) => {
      try {
        const jsonlFileName = concatBaseName || `concatenated-${Date.now()}.jsonl`;
        const jsonlFilePath = path.resolve(`${serverConfig.dataDir}/jsonl/${jsonlFileName}.jsonl`);
        const writeStream = fs.createWriteStream(jsonlFilePath);
        const stringify = jsonlines.stringify();

        stringify.pipe(writeStream);

        // const txtFilesArray = Array.isArray(txtFiles) ? txtFiles : Object.values(txtFiles);
        // const fff = Promise.resolve(txtFiles).then((jsonlObj) => {
        //   console.log(JSON.stringify(jsonlObj));
        //   return JSON.stringify(jsonlObj);
        // });

        from(txtFiles)
          .pipe(
            mergeMap((jsonlObj) => {
              const cleanedLine = JSON.stringify(jsonlObj);
              return bindNodeCallback(stringify.write.bind(stringify))(cleanedLine);
            })
          )
          .subscribe({
            complete: () => {
              stringify.end();
            },
            error: (err) => {
              console.log(err);
              reject(err);
            }
          });

        writeStream.on('finish', async () => {
          console.log(`Done concatenating files to ${jsonlFileName}`);

          try {
            const jsonlData = await fs.promises.readFile(jsonlFilePath);
            // @ts-ignore
            const concatenatedFile: Express.Multer.File = {
              // ...txtFilesArray[0],
              mimetype: 'application/json',
              originalname: jsonlFileName,
              buffer: jsonlData,
              path: jsonlFilePath
            } as Express.Multer.File;

            resolve(concatenatedFile);
          } catch (err) {
            reject(err);
          }
        });
      } catch (err: any) {
        reject(err);
      }
    });
  }

  /**
   *
   * @param readStream
   */
  readableStreamToObservable(readStream: NodeJS.ReadableStream): Observable<Buffer> {
    return from(readStream).pipe(
      mergeMap((chunk: Buffer | string | null) => {
        if (chunk === null) {
          // Signal the end of the stream
          return;
        } else if (Buffer.isBuffer(chunk)) {
          return [chunk];
        } else if (typeof chunk === 'string') {
          return [Buffer.from(chunk, 'utf8')];
        } else {
          throw new Error('Unsupported chunk type.');
        }
      })
    );
  }

  /**
   * Parse JSON file to JSON object
   *
   * @param jsonl
   */
  async parseJSONL(jsonl: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      try {
        // const jsonlParser = jsonlines.parse();
        const dataObj: any[] = [];

        // Split the jsonl string into lines
        const lines = jsonl.split('\n');

        lines.forEach((line) => {
          // Parse each line to a JavaScript object and add it to the dataObj array
          try {
            const data = JSON.parse(line);
            dataObj.push(data);
          } catch (err) {
            console.log('Invalid JSON line:', line);
          }
        });

        resolve(dataObj);
      } catch (err) {
        console.log(`Error parsing JSONL: ${err}`);
        reject(err);
      }
    });
  }

  /**
   * Convert uploaded files to JSONL
   *
   * @param files
   * @private
   */
  async encodeFiles(files: Express.Multer.File[]): Promise<JsonlLineInterface[]> {
    const processedFiles: JsonlLineInterface[] = [];

    for (const file of files) {
      const ext = path.extname(file.originalname);
      let processedFile: JsonlLineInterface;

      switch (ext) {
        case '.ts':
        // Parse TypeScript files
          processedFile = await this.parseTypescriptFile(file);
          break;
        case '.csv':
        case '.xlsx':
        // Convert tabular data to CSV
        //   processedFile = await this.tabularToCSV(file);
          break;
        case '.jsonl':
        // Keep JSONL files as they are
        //   processedFile = file.buffer.toString('utf-8');
          break;
        default:
        // Convert other files to TXT
        //   processedFile = await this.fileToTXT(file);
          break;
      }

      processedFiles.push(processedFile);
    }

    return processedFiles;
  }
}
