import { Module } from '@nestjs/common';
import { SyncEmitter } from './sync.emitter';
import { SyncOutboundDispatcher } from './sync-outbound.dispatcher';

/** Lightweight sync outbound wiring — no Profile/SyncService deps (avoids module cycles). */
@Module({
  providers: [SyncOutboundDispatcher, SyncEmitter],
  exports: [SyncEmitter],
})
export class SyncEmitterModule {}
