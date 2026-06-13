import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';

const HEARTBEAT_INTERVAL_MS = 60_000;

@Injectable()
export class BetterstackHeartbeatService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BetterstackHeartbeatService.name);
  private timer: ReturnType<typeof setInterval> | null = null;

  onModuleInit(): void {
    const url = process.env.BETTERSTACK_HEARTBEAT_URL;
    if (!url) {
      return;
    }

    const ping = () => {
      fetch(url, { method: 'GET' }).catch((err: unknown) => {
        const message = err instanceof Error ? err.message : String(err);
        this.logger.warn(`BetterStack heartbeat failed: ${message}`);
      });
    };

    ping();
    this.timer = setInterval(ping, HEARTBEAT_INTERVAL_MS);
    this.logger.log('BetterStack heartbeat enabled');
  }

  onModuleDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
