import {
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Response, Request } from "express";
import { ZodError } from "zod";

interface ErrorBody {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta: {
    timestamp: string;
    requestId?: string;
    path: string;
  };
}

@Catch()
export class GlobalExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const requestId = (request as any).requestId;
    const path = request.path;
    const timestamp = new Date().toISOString();

    let status: number;
    let body: ErrorBody;

    if (exception instanceof ZodError) {
      status = HttpStatus.BAD_REQUEST;
      body = {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Request validation failed",
          details: exception.issues.map((i) => ({
            field: i.path.join("."),
            message: i.message,
            code: i.code,
          })),
        },
        meta: { timestamp, requestId, path },
      };
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      body = {
        success: false,
        error: {
          code: this.toErrorCode(status),
          message:
            typeof res === "string"
              ? res
              : (res as any).message ?? exception.message,
          details: typeof res === "object" ? (res as any).message : undefined,
        },
        meta: { timestamp, requestId, path },
      };
    } else if (exception instanceof Error) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      this.logger.error(
        `[${requestId}] Unhandled: ${exception.message}`,
        exception.stack,
      );
      body = {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred",
        },
        meta: { timestamp, requestId, path },
      };
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      body = {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred",
        },
        meta: { timestamp, requestId, path },
      };
    }

    response.status(status).json(body);
  }

  private toErrorCode(status: number): string {
    switch (status) {
      case 400:
        return "BAD_REQUEST";
      case 401:
        return "UNAUTHORIZED";
      case 403:
        return "FORBIDDEN";
      case 404:
        return "NOT_FOUND";
      case 409:
        return "CONFLICT";
      case 422:
        return "UNPROCESSABLE_ENTITY";
      case 429:
        return "TOO_MANY_REQUESTS";
      default:
        return `HTTP_${status}`;
    }
  }
}
