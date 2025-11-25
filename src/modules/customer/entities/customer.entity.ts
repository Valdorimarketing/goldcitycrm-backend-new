import { Entity, Column, ManyToOne, OneToMany, JoinColumn, OneToOne } from 'typeorm';
import { CustomBaseEntity } from '../../../core/base/entities/base.entity';
import { Expose, Transform } from 'class-transformer';
import { User } from '../../user/entities/user.entity';
import { CustomerDynamicFieldValue } from '../../customer-dynamic-field-value/entities/customer-dynamic-field-value.entity';
import { Customer2Doctor } from '../../customer2doctor/entities/customer2doctor.entity';
import { Source } from 'src/modules/source/entities/source.entity';
import { Status } from 'src/modules/status/entities/status.entity';

@Entity('customer')
export class Customer extends CustomBaseEntity {
  @Column({ type: 'varchar', length: 255, nullable: true })
  @Expose()
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @Expose()
  surname: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @Expose()
  title: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @Expose()
  email: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @Expose()
  gender: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'birth_date' })
  @Expose()
  birthDate: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @Expose()
  patient: string;

  @Column({ type: 'varchar', length: 255, nullable: true, unique: true })
  @Expose()
  phone: string;

  @Column({ type: 'int', nullable: true, name: 'source_id' })
  @Expose()
  sourceId: number;

  @ManyToOne(() => Source, { nullable: true })
  @JoinColumn({ name: 'source_id' })
  @Expose()
  @Transform(({ value }) => value ? value.name : null)
  source?: Source;


  @Column({ type: 'varchar', length: 255, nullable: true })
  @Expose()
  job: string;

  @Column({ type: 'int', nullable: true, name: 'identity_number' })
  @Expose()
  identityNumber: number;

  @Column({ type: 'int', nullable: true, name: 'referance_customer' })
  @Expose()
  referanceCustomer: number;

  @OneToOne(() => Customer, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'referance_customer' })
  @Transform(({ value }) => value ? value.name : null)
  @Expose()
  referanceCustomerData: Customer;


  @Column({ type: 'int', nullable: true })
  @Expose()
  language: number;

  @Column({ type: 'boolean', default: true })
  @Expose()
  isActive: boolean;

  @Column({ type: 'int', nullable: true })
  @Expose()
  status: number;

  @ManyToOne(() => Status, { nullable: true })
  @JoinColumn({ name: 'status' })
  @Transform(({ value }) => value ? { name: value.name, color: value.color } : null)
  @Expose()
  statusData: Status;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @Expose()
  website: string;

  @Column({ type: 'int', nullable: true })
  @Expose()
  country: number;

  @Column({ type: 'int', nullable: true })
  @Expose()
  state: number;

  @Column({ type: 'int', nullable: true })
  @Expose()
  city: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @Expose()
  district: string;

  @Column({ type: 'int', nullable: true, name: 'postal_code' })
  @Expose()
  postalCode: number;

  @Column({ type: 'text', nullable: true })
  @Expose()
  address: string;

  @Column({ type: 'text', nullable: true })
  @Expose()
  url: string;

  @Column({ type: 'text', nullable: true })
  @Expose()
  message: string;

  @Column({ type: 'text', nullable: true })
  @Expose()
  checkup_package: string;

  @Column({ type: 'int', nullable: true, name: 'relevant_user' })
  @Expose()
  relevantUser: number;

  @ManyToOne(() => User, (user) => user.customers, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'relevant_user' })
  @Transform(({ value }) => value ? {
    name: value.name,
    avatar: value.avatar,
    lastActiveTime: value.lastActiveTime
  } : null)
  @Expose()
  relevantUserData: User;


  @Column({ type: 'text', nullable: true })
  @Expose()
  description: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  @Expose()
  image: string;

  @Column({ type: 'text', nullable: true, name: 'related_transaction' })
  @Expose()
  relatedTransaction: string;

  @Column({ type: 'datetime', nullable: true, name: 'reminding_date' })
  @Expose()
  remindingDate: Date;

  @OneToMany(
    () => CustomerDynamicFieldValue,
    (dynamicFieldValue) => dynamicFieldValue.customerRelation,
  )
  @Expose()
  dynamicFieldValues: CustomerDynamicFieldValue[];

  @OneToMany(() => Customer2Doctor, (customer2doctor) => customer2doctor.customer)
  customer2doctors: Customer2Doctor[];

  constructor(partial?: Partial<Customer>) {
    super(partial);
  }
}
