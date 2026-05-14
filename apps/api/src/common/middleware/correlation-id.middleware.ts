import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    const requestId = (req.headers["x-request-id"] as string) ?? randomUUID();
    (req as any).requestId = requestId;
    _res.setHeader("x-request-id", requestId);
    next();
  }
}
