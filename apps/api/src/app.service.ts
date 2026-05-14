import { Injectable } from "@nestjs/common";

/** Service for health responses. */
@Injectable()
export class AppService {
  /** Get health status. */
  getHealth() {
    return { status: "ok" };
  }
}
