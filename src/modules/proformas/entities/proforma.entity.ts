import { User } from 'src/modules/user/entities/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity('proformas')
export class Proforma {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'patient_id', nullable: true })
  patientId: number;

  @Column({ name: 'sale_id', nullable: true })
  saleId: number;

  @Column({ name: 'proforma_number', unique: true })
  proformaNumber: string;

  @Column({ type: 'date' })
  date: Date;

  // ✅ Proforma dili
  @Column({ name: 'language', default: 'tr' })
  language: string;

  // GENERAL INFORMATION
  @Column({ name: 'patient_name', nullable: true })
  patientName: string;

  // ✅ Hospital ID - ilişki için
  @Column({ name: 'hospital_id', nullable: true })
  hospitalId: number;

  @Column({ name: 'hospital', nullable: true })
  hospital: string;

  // ✅ Doctor ID - ilişki için
  @Column({ name: 'doctor_id', nullable: true })
  doctorId: number;

  @Column({ name: 'physician_name', nullable: true })
  physicianName: string;

  // ✅ Branch ID - ilişki için
  @Column({ name: 'branch_id', nullable: true })
  branchId: number;

  @Column({ name: 'physician_department', nullable: true })
  physicianDepartment: string;

  @Column({ name: 'age', nullable: true })
  age: string;

  @Column({ name: 'country', nullable: true })
  country: string;

  @Column({ name: 'comed_no', nullable: true })
  comedNo: string;

  // ADDITIONAL INFORMATION (Optional)
  @Column({ name: 'additional_info', type: 'text', nullable: true })
  additionalInfo: string;

  // PHYSICIAN'S OPINION (Optional)
  @Column({ name: 'physician_opinion', type: 'text', nullable: true })
  physicianOpinion: string;

  // TREATMENT DETAILS (JSON format)
  @Column({ name: 'treatment_items', type: 'json' })
  treatmentItems: TreatmentItem[];

  @Column({ name: 'grand_total', type: 'decimal', precision: 10, scale: 2 })
  grandTotal: number;

  @Column({ name: 'currency', default: 'USD' })
  currency: string;

  // Services Included (Optional)
  @Column({ name: 'services_included', type: 'json', nullable: true })
  servicesIncluded: string[];

  // BANK ACCOUNT INFORMATION
  @Column({ name: 'bank_name', default: 'DENİZ BANK' })
  bankName: string;

  @Column({ name: 'receiver_name', default: 'Samsun Medikal Grup Özel Sağlık Hizmetleri A.Ş. Vadi Branch' })
  receiverName: string;

  @Column({ name: 'branch_name', default: 'AVRUPA KURUMSAL, Istanbul – Turkey' })
  branchName: string;

  @Column({ name: 'branch_code', default: '3390' })
  branchCode: string;

  @Column({ name: 'bank_currency', default: 'USD' })
  bankCurrency: string;

  @Column({ name: 'iban', default: 'TR07 0013 4000 0033 4739 9000 78' })
  iban: string;

  @Column({ name: 'swift_code', default: 'DENITRIS' })
  swiftCode: string;

  // Hospital Contact Info (for footer)
  @Column({ name: 'hospital_address', type: 'text', nullable: true })
  hospitalAddress: string;

  @Column({ name: 'hospital_phone', nullable: true })
  hospitalPhone: string;

  @Column({ name: 'hospital_email', nullable: true })
  hospitalEmail: string;

  @Column({ name: 'templateType', nullable: true })
  templateType: string;

  // Status
  @Column({ 
    type: 'enum', 
    enum: ['draft', 'sent', 'paid', 'cancelled'],
    default: 'draft'
  })
  status: string;

  // ✅ İndirme onayı - sadece admin, doktor veya onaylanmış user indirebilir
  @Column({ name: 'download_approved', default: false })
  downloadApproved: boolean;

  // ✅ İndirme onayını veren kullanıcı
  @Column({ name: 'approved_by', nullable: true })
  approvedBy: number;

  // ✅ Onaylama tarihi
  @Column({ name: 'approved_at', type: 'timestamp', nullable: true })
  approvedAt: Date;

  @Column({ name: 'pdf_url', nullable: true })
  pdfUrl: string;

  // İlişki - sadece okuma için
  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  // Column - yazma için
  @Column({ nullable: true, name: 'created_by' })
  created_by: number;

  // ✅ Onaylayan kullanıcı ilişkisi
  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'approved_by' })
  approver: User;
 
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

export interface TreatmentItem {
  id?: string;
  procedure: string;
  visitType?: string;
  estimatedCost: string;
  quantity?: number;
  notes?: string;
}