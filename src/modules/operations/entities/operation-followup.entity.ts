import { CustomBaseEntity } from 'src/core/base/entities/base.entity';
import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { OperationType } from './operation-type.entity';
import { Customer } from 'src/modules/customer/entities/customer.entity';

interface FollowupItem {
    offset: number;
    date: string;
    done: boolean;
    note: string;
    kind: 'day' | 'month';
}

interface FollowupsData {
    days: FollowupItem[];
    months: FollowupItem[];
}

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

    // Günler ve aylar için takip verileri (note dahil)
    @Column({ type: 'json', nullable: true })
    followups: FollowupsData;

    @Column({ default: false })
    done: boolean;

    @Column({ type: 'datetime' })
    scheduled_at: Date;

    @Column({ type: 'int', nullable: true })
    created_by?: number | null;
}
