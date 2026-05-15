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
  implements NestInterceptor<T, T | ResponseEnvelope<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<T | ResponseEnvelope<T>> {
    const request = context.switchToHttp().getRequest<Request>();
    const requestId = (request as any).requestId ?? "";
    const path = request.path;
    const timestamp = new Date().toISOString();

    const isAdminRoute = path.startsWith("/v1/admin");
    if (!isAdminRoute) {
      return next.handle();
    }

    return next.handle().pipe(
      map((data) => ({
        success: true as const,
        data,
        meta: { timestamp, requestId, path },
      })),
    );
  }
}
