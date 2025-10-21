import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { CustomBaseEntity } from '../../../core/base/entities/base.entity';
import { Expose } from 'class-transformer';
import { User } from '../../user/entities/user.entity';
import { CustomerDynamicFieldValue } from '../../customer-dynamic-field-value/entities/customer-dynamic-field-value.entity';
import { Customer2Doctor } from '../../customer2doctor/entities/customer2doctor.entity';

@Entity('customer')
export class Customer extends CustomBaseEntity {
  @Column({ type: 'int', nullable: true })
  @Expose()
  user: number;

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

  @Column({ type: 'varchar', length: 255, nullable: true, unique: true })
  @Expose()
  phone: string;

  @Column({ type: 'int', nullable: true, name: 'source_id' })
  @Expose()
  sourceId: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @Expose()
  job: string;

  @Column({ type: 'int', nullable: true, name: 'identity_number' })
  @Expose()
  identityNumber: number;

  @Column({ type: 'int', nullable: true, name: 'referance_customer' })
  @Expose()
  referanceCustomer: number;

  @Column({ type: 'int', nullable: true })
  @Expose()
  language: number;

  @Column({ type: 'boolean', default: true })
  @Expose()
  isActive: boolean;

  @Column({ type: 'int', nullable: true })
  @Expose()
  status: number;

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

  @Column({ type: 'int', nullable: true, name: 'relevant_user' })
  @Expose()
  relevantUser: number;

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

  @OneToMany(
    () => Customer2Doctor,
    (customer2doctor) => customer2doctor.customer,
  )
  customer2doctors: Customer2Doctor[];

  constructor(partial?: Partial<Customer>) {
    super(partial);
  }
}
