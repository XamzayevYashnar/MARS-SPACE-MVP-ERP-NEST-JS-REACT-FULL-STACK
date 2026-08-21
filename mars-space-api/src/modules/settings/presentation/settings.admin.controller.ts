import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { ApiOkEnvelope } from '../../../common/decorators/api-response.decorators';
import { Roles } from '../../../common/decorators/auth.decorators';
import { SettingKeyParamDto } from '../../../common/dto/params.dto';
import { PutSettingDto, SettingResponseDto } from '../application/dto/setting.dto';
import { ListSettingsUseCase } from '../application/use-cases/list-settings.use-case';
import { PutSettingUseCase } from '../application/use-cases/put-setting.use-case';

@ApiTags('Admin: Settings')
@ApiBearerAuth('access-token')
@Roles(UserRole.ADMIN)
@Controller('admin/settings')
export class SettingsAdminController {
  constructor(
    private readonly listSettings: ListSettingsUseCase,
    private readonly putSetting: PutSettingUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Every settings record' })
  @ApiOkEnvelope(SettingResponseDto)
  list(): Promise<SettingResponseDto[]> {
    return this.listSettings.execute();
  }

  @Put(':key')
  @ApiOperation({ summary: 'Replace the value stored under a settings key' })
  @ApiOkEnvelope(SettingResponseDto)
  put(
    @Param() { key }: SettingKeyParamDto,
    @Body() dto: PutSettingDto,
  ): Promise<SettingResponseDto> {
    return this.putSetting.execute(key, dto.value);
  }
}
