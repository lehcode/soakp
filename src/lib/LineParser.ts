import jsonlines from 'jsonlines';

export class LineParser {
  /**
   * jsonlines parser instance
   *
   * @private
   */
  private readonly parserService: jsonlines.Parser;

  /**
   * jsonlines stringifier instance
   *
   * @private
   */
  private readonly stringifierService: jsonlines.Stringifier;

  /**
   * @constructor
   */
  constructor() {
    this.parserService = jsonlines.parse();
    this.stringifierService = jsonlines.stringify();
  }

  /**
   * @return {jsonlines.Parser}
   */
  get parser(): jsonlines.Parser {
    return this.parserService;
  }

  /**
   * @return {jsonlines.Stringifier}
   */
  get stringifier(): jsonlines.Stringifier {
    return this.stringifierService;
  }

  /**
   * Cleanup text for AI model
   *
   * @param line
   */
  static cleanup(line: string) {
    const cleanLine = line.replace(/^\s+/, '');

    return cleanLine;
  }
}
