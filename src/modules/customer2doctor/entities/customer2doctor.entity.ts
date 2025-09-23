import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { CustomBaseEntity } from '../../../core/base/entities/base.entity';
import { Customer } from '../../customer/entities/customer.entity';
import { Doctor } from '../../doctor/entities/doctor.entity';

@Entity('customer2doctor')
export class Customer2Doctor extends CustomBaseEntity {
  @Column({ type: 'int', nullable: false })
  doctorId: number;

  @Column({ type: 'int', nullable: false })
  customerId: number;

  @Column({ type: 'text', nullable: true })
  note: string;

  @Column({ type: 'text', nullable: true })
  doctorComment: string;

  @ManyToOne(() => Doctor, (doctor) => doctor.customer2doctors)
  @JoinColumn({ name: 'doctorId' })
  doctor: Doctor;

  @ManyToOne(() => Customer, (customer) => customer.customer2doctors)
  @JoinColumn({ name: 'customerId' })
  customer: Customer;
}
