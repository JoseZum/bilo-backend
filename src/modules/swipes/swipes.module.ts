import { Module } from '@nestjs/common';
import { PropertiesModule } from '../properties/properties.module';
import { SwipesController } from './swipes.controller';
import { SwipesService } from './swipes.service';

@Module({
  imports: [PropertiesModule],
  controllers: [SwipesController],
  providers: [SwipesService],
  exports: [SwipesService],
})
export class SwipesModule {}
