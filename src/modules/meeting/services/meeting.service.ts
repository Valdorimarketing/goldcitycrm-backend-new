import { Injectable } from '@nestjs/common';
import { BaseService } from '../../../core/base/services/base.service';
import { Meeting } from '../entities/meeting.entity';
import { MeetingRepository } from '../repositories/meeting.repository';
import {
  CreateMeetingDto,
  UpdateMeetingDto,
  MeetingResponseDto,
} from '../dto/create-meeting.dto';
import { plainToInstance } from 'class-transformer';
import { CustomerHistoryService } from '../../customer-history/services/customer-history.service';
import { CustomerHistoryAction } from '../../customer-history/entities/customer-history.entity';
import { MeetingStatusRepository } from '../../meeting-status/repositories/meeting-status.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../../product/entities/product.entity';
import { SalesProduct } from '../../sales-product/entities/sales-product.entity';
import { CustomerNote } from '../../customer-note/entities/customer-note.entity';

@Injectable()
export class MeetingService extends BaseService<Meeting> {
  constructor(
    private readonly meetingRepository: MeetingRepository,
    private readonly customerHistoryService: CustomerHistoryService,
    private readonly meetingStatusRepository: MeetingStatusRepository,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(SalesProduct)
    private readonly salesProductRepository: Repository<SalesProduct>,
    @InjectRepository(CustomerNote)
    private readonly customerNoteRepository: Repository<CustomerNote>,
  ) {
    super(meetingRepository, Meeting);
  }

  async createMeeting(
    createMeetingDto: CreateMeetingDto,
  ): Promise<MeetingResponseDto> {
    const meeting = await this.create(createMeetingDto, MeetingResponseDto);

    // Log to customer history
    if (createMeetingDto.customer) {
      await this.customerHistoryService.logCustomerAction(
        createMeetingDto.customer,
        CustomerHistoryAction.MEETING_CREATED,
        `Toplantı planlandı: ${createMeetingDto.description || 'Yeni Toplantı'}`,
        createMeetingDto,
        null,
        createMeetingDto.user,
        meeting.id,
      );
    }

    // Process action lists from product
    const fullMeeting = await this.meetingRepository.findOneWithSalesProduct(
      meeting.id,
    );
    if (fullMeeting) {
      await this.processActionLists(fullMeeting);
    }

    // If salesProductId is provided, fetch the meeting with relation
    if (createMeetingDto.salesProductId) {
      const meetingWithRelation =
        await this.meetingRepository.findOneWithSalesProduct(meeting.id);
      return plainToInstance(MeetingResponseDto, meetingWithRelation, {
        excludeExtraneousValues: true,
      });
    }

    return meeting;
  }

  async updateMeeting(
    id: number,
    updateMeetingDto: UpdateMeetingDto,
  ): Promise<MeetingResponseDto> {
    // Get current meeting to check for status change
    const currentMeeting = await this.findOneById(id);
    const oldStatus = currentMeeting?.meetingStatus;

    const meeting = await this.update(updateMeetingDto, id, MeetingResponseDto);

    // Check for meeting status change
    if (
      updateMeetingDto.meetingStatus &&
      oldStatus !== updateMeetingDto.meetingStatus &&
      currentMeeting?.customer
    ) {
      // Get status names for history log
      const oldStatusEntity = oldStatus
        ? await this.meetingStatusRepository.findOneById(oldStatus)
        : null;
      const newStatusEntity = await this.meetingStatusRepository.findOneById(
        updateMeetingDto.meetingStatus,
      );

      const oldStatusName = oldStatusEntity?.name || 'Belirtilmemiş';
      const newStatusName = newStatusEntity?.name || 'Belirtilmemiş';

      await this.customerHistoryService.logCustomerAction(
        currentMeeting.customer,
        CustomerHistoryAction.MEETING_STATUS_CHANGE,
        `Toplantı durumu değiştirildi: ${oldStatusName}->${newStatusName}`,
        { oldStatus, newStatus: updateMeetingDto.meetingStatus },
        null,
        updateMeetingDto.user,
        id,
      );
    }

    // If salesProductId is provided or changed, fetch the meeting with relation
    if (updateMeetingDto.salesProductId !== undefined) {
      const meetingWithRelation =
        await this.meetingRepository.findOneWithSalesProduct(meeting.id);
      return plainToInstance(MeetingResponseDto, meetingWithRelation, {
        excludeExtraneousValues: true,
      });
    }

    return meeting;
  }

  async getMeetingById(id: number): Promise<Meeting> {
    return this.meetingRepository.findOneWithSalesProduct(id);
  }

  async getAllMeetings(): Promise<Meeting[]> {
    return this.findAll();
  }

  async getMeetingsByCustomer(customer: number): Promise<Meeting[]> {
    return this.meetingRepository.findByCustomer(customer);
  }

  async getMeetingsByUser(user: number): Promise<Meeting[]> {
    return this.meetingRepository.findByUser(user);
  }

  async getMeetingsByStatus(meetingStatus: number): Promise<Meeting[]> {
    return this.meetingRepository.findByStatus(meetingStatus);
  }

  async getMeetingsBySalesProduct(salesProductId: number): Promise<Meeting[]> {
    return this.meetingRepository.findBySalesProduct(salesProductId);
  }

  async deleteMeeting(id: number): Promise<Meeting> {
    return this.remove(id);
  }

  private async processActionLists(meeting: Meeting): Promise<void> {
    // salesProductId yoksa veya startTime yoksa işlem yapma
    if (!meeting.salesProductId || !meeting.startTime) {
      return;
    }

    // SalesProduct'tan Product bilgisini al
    const salesProduct = await this.salesProductRepository.findOne({
      where: { id: meeting.salesProductId },
    });

    if (!salesProduct) return;

    // Product'un actionList'ini al
    const product = await this.productRepository.findOne({
      where: { id: salesProduct.product },
    });

    if (!product || !product.actionList || product.actionList.length === 0) {
      return;
    }

    // Her action için CustomerNote oluştur
    for (const action of product.actionList) {
      const noteDate = new Date(meeting.startTime);
      noteDate.setDate(noteDate.getDate() + action.dayOffset);

      const customerNote = this.customerNoteRepository.create({
        customer: meeting.customer,
        user: meeting.user,
        note: `${action.description} - ${product.name}`,
        isReminding: true,
        remindingAt: noteDate,
        noteType: 'Şablon Araması',
      });

      await this.customerNoteRepository.save(customerNote);
    }
  }
}
