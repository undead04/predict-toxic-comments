export class ResponseDTO<T, E = any> {
  private message: string;
  private data: T | null;
  private statusCode: number;
  private errors: E | null;

  private constructor(
    message: string,
    data: T | null,
    statusCode: number,
    errors: E | null
  ) {
    this.message = message;
    this.data = data;
    this.statusCode = statusCode;
    this.errors = errors;
  }

  // U là kiểu dữ liệu trả về, ví dụ YoutubeComment[]
  static success<U>(
    message: string = "Success",
    statusCode: number = 200
  ): ResponseDTO<U, never> {
    return new ResponseDTO<U, never>(message, null, statusCode, null);
  }

  // E là kiểu của lỗi, ví dụ string[] hoặc string
  static error<E>(
    message: string,
    errors: E,
    statusCode: number = 500
  ): ResponseDTO<never, E> {
    return new ResponseDTO<never, E>(message, null, statusCode, errors);
  }
}
