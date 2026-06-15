import { Module } from '@nestjs/common';
import { ArtistPathController, PublicArtistPathController } from './artist-path.controller';
import { ArtistPathSecretGuard } from './artist-path-secret.guard';
import { ArtistPathService } from './artist-path.service';

@Module({
  controllers: [ArtistPathController, PublicArtistPathController],
  providers: [ArtistPathService, ArtistPathSecretGuard],
  exports: [ArtistPathService],
})
export class ArtistPathModule {}
