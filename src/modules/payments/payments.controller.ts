import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/types/auth-user';
import { AddPaymentMethodDto } from './dto/add-payment-method.dto';
import { PayDto } from './dto/pay.dto';
import { PaymentsService } from './payments.service';

@ApiTags('payments')
@ApiBearerAuth()
@Controller()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('leases/:leaseId/payments')
  @ApiOperation({ summary: 'List payments for a lease' })
  listForLease(
    @Param('leaseId', new ParseUUIDPipe()) leaseId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.paymentsService.listForLease(leaseId, user.id);
  }

  @Get('payments/methods')
  @ApiOperation({ summary: 'List current user payment methods' })
  listPaymentMethods(@CurrentUser() user: AuthUser) {
    return this.paymentsService.listPaymentMethods(user.id);
  }

  @Post('payments/methods')
  @ApiOperation({ summary: 'Add a payment method' })
  addPaymentMethod(
    @CurrentUser() user: AuthUser,
    @Body() dto: AddPaymentMethodDto,
  ) {
    return this.paymentsService.addPaymentMethod(user.id, dto);
  }

  @Delete('payments/methods/:id')
  @ApiOperation({ summary: 'Remove a payment method' })
  removePaymentMethod(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.paymentsService.removePaymentMethod(user.id, id);
  }

  @Get('payments/:id')
  @ApiOperation({ summary: 'Get a payment by id' })
  findById(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.paymentsService.findById(id, user.id);
  }

  @Post('payments/:id/pay')
  @ApiOperation({ summary: 'Pay a payment' })
  pay(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: PayDto,
  ) {
    return this.paymentsService.pay(id, user.id, dto);
  }

  @Post('payments/:id/simulate-success')
  @ApiOperation({ summary: '[TEST] Force payment to PAID' })
  simulateSuccess(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.paymentsService.simulateSuccess(id);
  }

  @Post('payments/:id/simulate-failure')
  @ApiOperation({ summary: '[TEST] Force payment to FAILED' })
  simulateFailure(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.paymentsService.simulateFailure(id);
  }
}
