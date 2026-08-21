import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiOkEnvelope } from '../../../common/decorators/api-response.decorators';
import { Public } from '../../../common/decorators/auth.decorators';
import { SettingsBundleDto } from '../application/dto/setting.dto';
import { GetPublicSettingsUseCase } from '../application/use-cases/get-public-settings.use-case';

@ApiTags('Public')
@Public()
@Controller('settings')
export class SettingsController {
  constructor(private readonly getPublicSettings: GetPublicSettingsUseCase) {}

  @Get()
  @ApiOperation({
    summary: 'Public settings bundle',
    description: 'Returns contacts, socials, hero stats and SEO defaults as one object.',
  })
  @ApiOkEnvelope(SettingsBundleDto)
  get(): Promise<Record<string, unknown>> {
    return this.getPublicSettings.execute();
  }
}
