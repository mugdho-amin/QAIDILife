import { Controller, Get } from "@nestjs/common";
import { AppService } from "./app.service";

/** Health controller for QAIDILife API. */
@Controller()
export class AppController {
  /** Create a health controller. */
  constructor(private readonly appService: AppService) {}

  /** Get API health status. */
  @Get()
  getHealth() {
    return this.appService.getHealth();
  }
}
