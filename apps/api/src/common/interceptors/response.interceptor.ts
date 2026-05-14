import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Observable, map } from "rxjs";
import { Request } from "express";

interface ResponseEnvelope<T> {
  success: true;
  data: T;
  meta: {
    timestamp: string;
    requestId: string;
    path: string;
  };
}

@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, ResponseEnvelope<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ResponseEnvelope<T>> {
    const request = context.switchToHttp().getRequest<Request>();
    const requestId = (request as any).requestId ?? "";
    const path = request.path;
    const timestamp = new Date().toISOString();

    return next.handle().pipe(
      map((data) => ({
        success: true as const,
        data,
        meta: { timestamp, requestId, path },
      })),
    );
  }
}
