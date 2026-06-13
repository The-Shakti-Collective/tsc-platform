import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ClerkAuthGuard } from '../../common/auth/clerk-auth.guard';
import { parseSchema } from '../../common/validation/parse-schema';
import {
  ContractCreateSchema,
  ContractListQuerySchema,
  ContractSignSchema,
} from './schema';
import { ContractService } from './contract.service';

@Controller('contracts')
@UseGuards(ClerkAuthGuard)
export class ContractController {
  constructor(private readonly contractService: ContractService) {}

  @Get('templates')
  listTemplates() {
    return this.contractService.listTemplates();
  }

  @Post()
  create(@Body() body: unknown) {
    return this.contractService.create(parseSchema(ContractCreateSchema, body));
  }

  @Get(':id')
  getDetail(@Param('id') id: string) {
    return this.contractService.getDetail(id);
  }

  @Patch(':id/sign')
  sign(@Param('id') id: string, @Body() body: unknown) {
    const parsed = parseSchema(ContractSignSchema, body ?? {});
    return this.contractService.sign(id, parsed.documentUrl);
  }
}

@Controller('artists')
@UseGuards(ClerkAuthGuard)
export class ArtistContractsController {
  constructor(private readonly contractService: ContractService) {}

  @Get(':id/contracts')
  listContracts(
    @Param('id') id: string,
    @Query() query: Record<string, unknown>,
  ) {
    return this.contractService.listArtistContracts(
      id,
      parseSchema(ContractListQuerySchema, query),
    );
  }
}

@Controller('brands')
@UseGuards(ClerkAuthGuard)
export class BrandContractsController {
  constructor(private readonly contractService: ContractService) {}

  @Get(':id/contracts')
  listContracts(
    @Param('id') id: string,
    @Query() query: Record<string, unknown>,
  ) {
    return this.contractService.listBrandContracts(
      id,
      parseSchema(ContractListQuerySchema, query),
    );
  }
}
