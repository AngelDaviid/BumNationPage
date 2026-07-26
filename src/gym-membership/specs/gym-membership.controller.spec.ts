import { Test, TestingModule } from '@nestjs/testing';
import { GymMembershipController } from './gym-membership.controller';

describe('GymMembershipController', () => {
  let controller: GymMembershipController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GymMembershipController],
    }).compile();

    controller = module.get<GymMembershipController>(GymMembershipController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
