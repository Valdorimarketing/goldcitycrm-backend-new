import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { CustomBaseEntity } from '../../../core/base/entities/base.entity';
import { Expose, Transform } from 'class-transformer';
import { SalesProduct } from '../../sales-product/entities/sales-product.entity';
import { Hospital } from '../../hospital/entities/hospital.entity';
import { Doctor } from '../../doctor/entities/doctor.entity';
import { Customer } from 'src/modules/customer/entities/customer.entity';
import { Branch } from 'src/modules/branch/entities/branch.entity';
import { MeetingStatus } from 'src/modules/meeting-status/entities/meeting-status.entity';

@Entity('meeting')
export class Meeting extends CustomBaseEntity {
  @Column({ type: 'int' })
  @Expose()
  customer: number;

  @ManyToOne(() => Customer, { nullable: true })
  @JoinColumn({ name: 'customer' })
  @Transform(({ value }) => value ? {name: value.name, surname: value.surname, id: value.id} : null)
  @Expose()
  customerData: Customer;

  @Column({ type: 'int', nullable: true, name: 'hospital_id' })
  @Expose()
  hospitalId: number;

  @ManyToOne(() => Hospital, { nullable: true })
  @JoinColumn({ name: 'hospital_id' })
  @Expose()
  hospital: Hospital;

  @Column({ type: 'int', nullable: true, name: 'branch_id' })
  @Expose()
  branchId: number;

  @ManyToOne(() => Branch, { nullable: true })
  @JoinColumn({ name: 'branch_id' })
  @Expose()
  branch: Branch;

  @Column({ type: 'int', nullable: true, name: 'doctor_id' })
  @Expose()
  doctorId: number;

  @ManyToOne(() => Doctor, { nullable: true })
  @JoinColumn({ name: 'doctor_id' })
  @Expose()
  doctor: Doctor;

  @Column({ type: 'timestamp', nullable: true, name: 'reminding_at' })
  @Expose()
  remindingAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'start_time' })
  @Expose()
  startTime: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'end_time' })
  @Expose()
  endTime: Date;

  @Column({ type: 'int' })
  @Expose()
  user: number;

  // ✅ DÜZELTİLDİ: Meeting Status İlişkisi
  @Column({ type: 'int', nullable: true, name: 'meeting_status' })
  @Expose()
  meetingStatusId: number;

  @ManyToOne(() => MeetingStatus, { nullable: true })
  @JoinColumn({ name: 'meeting_status' })
  @Expose()
  meetingStatus: MeetingStatus;

  @Column({ type: 'text', nullable: true })
  @Expose()
  description: string;

  @Column({ type: 'int', nullable: true, name: 'sales_product_id' })
  @Expose()
  salesProductId: number;

  @ManyToOne(() => SalesProduct, { nullable: true })
  @JoinColumn({ name: 'sales_product_id' })
  @Expose()
  salesProduct: SalesProduct;

  constructor(partial?: Partial<Meeting>) {
    super(partial);
  }
}