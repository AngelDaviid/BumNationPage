import { Test, TestingModule } from '@nestjs/testing';
import { GymMembershipService } from './gym-membership.service';

describe('GymMembershipService', () => {
  let service: GymMembershipService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GymMembershipService],
    }).compile();

    service = module.get<GymMembershipService>(GymMembershipService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
