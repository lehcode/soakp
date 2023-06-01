import { StatusCode } from "../enums/StatusCode.enum";
import { Message } from "../enums/Message.enum";

export interface ResponseInterface {
  status: undefined ? StatusCode;
  message: undefined ? Message;
  data: undefined | [];
}
