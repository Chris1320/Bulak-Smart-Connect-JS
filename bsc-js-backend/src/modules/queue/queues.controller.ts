import { Controller, Get, Param, Logger } from '@nestjs/common';
import { QueueService } from './queue.service';
import { QueueStatus } from './entities/queue.entity';

interface QueueDetails {
  firstName?: string;
  lastName?: string;
  middleInitial?: string;
  reasonOfVisit?: string;
  address?: string;
  phoneNumber?: string;
}

@Controller('queues')
export class QueuesController {
  private readonly logger = new Logger(QueuesController.name);

  constructor(private readonly queueService: QueueService) {}
  // This endpoint is for supporting the legacy API path that the frontend is using
  @Get('walk-in')
  async getWalkInQueues() {
    this.logger.log('GET /queues/walk-in endpoint called');
    try {
      // Get both pending and serving queues with details using the service methods
      const [pendingQueuesWithDetails, servingQueuesWithDetails] =
        await Promise.all([
          this.queueService.findByStatusWithDetails(QueueStatus.PENDING),
          this.queueService.findByStatusWithDetails(QueueStatus.SERVING),
        ]);

      this.logger.log('Found pending queues:', pendingQueuesWithDetails.length);
      this.logger.log('Found serving queues:', servingQueuesWithDetails.length);

      // Combine all queues
      const allQueues = [
        ...pendingQueuesWithDetails,
        ...servingQueuesWithDetails,
      ];

      // Extract details from the nested structure and flatten them for the frontend
      const result = allQueues.map((queue) => {
        // For debugging
        this.logger.log('Processing queue:', queue.id, 'status:', queue.status);

        // Handle potential null/undefined details
        const details: QueueDetails | null = Array.isArray(queue.details)
          ? (queue.details[0] as QueueDetails)
          : (queue.details as QueueDetails);

        return {
          id: queue.id,
          queueNumber: queue.queueNumber,
          status: queue.status,
          counterNumber: queue.counterNumber,
          createdAt: queue.createdAt,
          completedAt: queue.completedAt,
          estimatedWaitTime: queue.estimatedWaitTime,
          firstName: details?.firstName || null,
          lastName: details?.lastName || null,
          middleInitial: details?.middleInitial || null,
          reasonOfVisit: details?.reasonOfVisit || null,
          address: details?.address || null,
          phoneNumber: details?.phoneNumber || null,
        };
      });

      this.logger.log(`Returning ${result.length} walk-in queues`);
      return result;
    } catch (err: unknown) {
      this.logger.error('Error fetching walk-in queues:', err);
      throw err;
    }
  }

  @Get('user/:userId')
  async getUserQueues(@Param('userId') userId: string) {
    this.logger.log('GET /queues/user/' + userId + ' endpoint called');
    try {
      // Find queues for the specific user that are not completed
      const userQueues =
        await this.queueService.findByUserIdWithDetails(userId);

      this.logger.log('Found user queues:', userQueues.length);

      const result = userQueues.map((queue) => {
        const details = Array.isArray(queue.details)
          ? queue.details[0]
          : queue.details;

        return {
          id: queue.id,
          queueNumber: queue.queueNumber,
          status: queue.status,
          counterNumber: queue.counterNumber,
          createdAt: queue.createdAt,
          completedAt: queue.completedAt,
          firstName: details?.firstName || null,
          lastName: details?.lastName || null,
          reasonOfVisit: details?.reasonOfVisit || null,
        };
      });

      return result;
    } catch (err) {
      this.logger.error('Error fetching user queues:', err);
      throw err;
    }
  }

  @Get(':id')
  async getQueueById(@Param('id') id: string) {
    this.logger.log('GET /queues/' + id + ' endpoint called');
    try {
      const queueId = parseInt(id, 10);
      if (isNaN(queueId)) {
        throw new Error('Invalid queue ID');
      }

      const queue = await this.queueService.findOne(queueId);

      if (!queue) {
        throw new Error('Queue not found');
      }

      const details = Array.isArray(queue.details)
        ? queue.details[0]
        : queue.details;

      return {
        id: queue.id,
        queueNumber: queue.queueNumber,
        status: queue.status,
        counterNumber: queue.counterNumber,
        createdAt: queue.createdAt,
        completedAt: queue.completedAt,
        firstName: details?.firstName || null,
        lastName: details?.lastName || null,
        reasonOfVisit: details?.reasonOfVisit || null,
      };
    } catch (err) {
      this.logger.error('Error fetching queue:', err);
      throw err;
    }
  }
}
