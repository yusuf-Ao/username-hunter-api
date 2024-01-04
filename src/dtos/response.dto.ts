export class ResponseDto {
  message: string;
  statusCode: number;
  data: any;
  success: boolean;
  results: number;

  constructor() {
    this.data = [];
    this.results = 0;
  }
}
