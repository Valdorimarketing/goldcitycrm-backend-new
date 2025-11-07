import { CustomBaseEntity } from 'src/core/base/entities/base.entity';
import { Entity, Column, CreateDateColumn, ManyToOne, JoinColumn, PrimaryColumn } from 'typeorm';
import { OperationType } from './operation-type.entity';
import { Customer } from 'src/modules/customer/entities/customer.entity';

@Entity({ name: 'operation_followups' })
export class OperationFollowup extends CustomBaseEntity {

    @Column({ type: 'int', nullable: false })
    customer_id: number;

    @ManyToOne(() => Customer, { eager: true })
    @JoinColumn({ name: 'customer_id' })
    customer: Customer;
 

    @Column({ type: 'int' })
    operation_type_id: number;

    @ManyToOne(() => OperationType, type => type.followups, { eager: true })
    @JoinColumn({ name: 'operation_type_id' })
    operationType: OperationType;

    // ✅ kind alanı eklendi (day | month)
    @Column({ type: 'json', nullable: true })
    followups: {
        days: { offset: number; date: string; done: boolean; kind: 'day' }[];
        months: { offset: number; date: string; done: boolean; kind: 'month' }[];
    };

    @Column({ default: false })
    done: boolean


    @Column({ type: 'datetime' })
    scheduled_at: Date;


    @Column({ type: 'int', nullable: true })
    created_by?: number | null;

}
