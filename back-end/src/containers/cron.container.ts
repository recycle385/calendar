import { CronService } from '../services/cron.service';
import { MailService } from '../services/mail.service';
import {
  calendarRepository,
  dateInfoRepository,
  participantRepository,
  userRepository,
} from './repository.container';
import { voteService } from './service.container';

const mailService = new MailService();

export const cronService = new CronService(
  calendarRepository,
  dateInfoRepository,
  voteService,
  userRepository,
  participantRepository,
  mailService
);
