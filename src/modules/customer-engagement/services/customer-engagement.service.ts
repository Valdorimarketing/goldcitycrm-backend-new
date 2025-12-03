import { Injectable } from '@nestjs/common';
import { CustomerEngagementRepository } from '../repositories/customer-engagement.repository';
import {
    CreateCustomerEngagementDto,
} from '../dto/create-customer-engagement.dto';
import {
    CreateCustomerCallLogDto,
} from '../dto/create-customer-call-log.dto';
import { CustomerCallLogRepository } from '../repositories/customer-call-log.repository';
import { CustomerEngagement, CustomerEngagementRole } from '../entities/customer-engagement.entity';
import { BaseService } from 'src/core/base/services/base.service';
import { ActiveEngagementDto, DashboardKpiDto, EngagementHistoryDto, EngagementStatsDto, EngagementTimelineEventDto, UserPerformanceDto } from '../dto/engagement-stats.dto';
import { Between, IsNull, Not } from 'typeorm';
import { User } from 'src/modules/user/entities/user.entity';
import { Status } from 'src/modules/status/entities/status.entity';

@Injectable()
export class CustomerEngagementService extends BaseService<CustomerEngagement> {
    constructor(
        private readonly engagementRepository: CustomerEngagementRepository,
        private readonly callLogRepository: CustomerCallLogRepository,
    ) {
        super(engagementRepository, CustomerEngagement);
    }


    async releaseCustomer(customerId: number, finalStatus?: string): Promise<void> {
        const activeEngagement = await this.engagementRepository.findOne({
            where: {
                customer: { id: customerId },
                releasedAt: IsNull(),
            },
        });

        if (activeEngagement) {
            activeEngagement.releasedAt = new Date();

            if (finalStatus) {
                activeEngagement.meta = {
                    ...activeEngagement.meta,
                    finalStatus,
                };
            }

            await this.engagementRepository.save(activeEngagement);
        }
    }


    // ✅ Tüm engagement'ları kapat (isClosed veya isSale durumunda)
    async closeAllEngagements(customerId: number) {
        return this.engagementRepository.closeActiveEngagements(customerId);
    }



    async getActiveEngagement(customerId: number): Promise<CustomerEngagement | null> {
        return this.engagementRepository.findActiveEngagement(customerId);
    }

    async closeSalesEngagements(customerId: number) {
        return this.engagementRepository.closeActiveEngagements(
            customerId,
            CustomerEngagementRole.SALES,
        );
    }

    async closeDoctorEngagements(customerId: number) {
        return this.engagementRepository.closeActiveEngagements(
            customerId,
            CustomerEngagementRole.DOCTOR,
        );
    }

    async startEngagement(dto: CreateCustomerEngagementDto, whoCanSee?: number[]) {
        const now = dto.assignedAt ?? new Date(); 
 
        await this.engagementRepository.closeActiveEngagements(
            dto.customer,
            dto.role, // ← BURADA role parametresi var
        );
 


        const newEngagement = await this.engagementRepository.insertEngagement(
            dto.customer,
            dto.user,
            dto.role,
            now,
            dto.meta,
            whoCanSee || [dto.user],
        );

      
        return newEngagement;
    }

    // ✅ YENİ METOD: Doktor ekle
    async addDoctorToEngagement(customerId: number, doctorUserId: number): Promise<void> {
        const engagement = await this.engagementRepository.findActiveEngagement(customerId);

        if (engagement) {
            await this.engagementRepository.addUserToWhoCanSee(engagement.id, doctorUserId);
        }
    }

    // ✅ YENİ METOD: Kullanıcının engagement'ı görebilir mi?
    async canUserSeeEngagement(engagementId: number, userId: number): Promise<boolean> {
        const engagement = await this.findOneById(engagementId);

        if (!engagement) return false;

        const whoCanSee = engagement.whoCanSee || [];
        return whoCanSee.includes(userId);
    }

    // ✅ YENİ: Profile view için first touch
    async registerProfileView(customerId: number, userId: number) {
        const now = new Date();

 

        // Aktif engagement bul (sadece bu kullanıcıya ait)
        let engagement = await this.engagementRepository.findActiveEngagement(
            customerId,
            undefined,
            userId,
        );

 

        // ✅ Engagement yoksa yeni AÇMA, sadece log at
        if (!engagement) {
            console.log('⚠️ Kullanıcı için aktif engagement yok, touch kaydedilmedi');
            return null;
        }

        // DOKTOR ise: assignedAt'tan first_touch_at'ı otomatik set et
        if (engagement.role === CustomerEngagementRole.DOCTOR && !engagement.firstTouchAt) {
            const updateData: any = {
                firstTouchAt: now,
                lastTouchAt: now,
            };

            // Meta'daki inheritedFirstCallAt varsa, firstCallAt'a kopyala
            if (engagement.meta?.inheritedFirstCallAt) {
                updateData.firstCallAt = engagement.meta.inheritedFirstCallAt;
            }

            await this.engagementRepository.update(engagement.id, updateData);
        }
        // SALES ise: Normal touch tracking
        else if (engagement.role === CustomerEngagementRole.SALES) {
            if (!engagement.firstTouchAt) {
                await this.engagementRepository.update(engagement.id, {
                    firstTouchAt: now,
                    lastTouchAt: now,
                });
            } else {
                await this.engagementRepository.update(engagement.id, {
                    lastTouchAt: now,
                });
            }
        }

        return engagement;
    }




    // ✅ YENİ: Telefon numarası görüntüleme için first call
    async registerPhoneView(customerId: number, userId: number) {
        const now = new Date();

        let engagement = await this.engagementRepository.findActiveEngagement(
            customerId,
            undefined,
            userId,
        );

        // ✅ Engagement yoksa AÇMA
        if (!engagement) {
            console.log('⚠️ Kullanıcı için aktif engagement yok, phone view kaydedilmedi');
            return null;
        }

        // First call henüz yoksa ekle
        if (!engagement.firstCallAt) {
            await this.engagementRepository.update(engagement.id, {
                firstCallAt: now,
                lastTouchAt: now,
            });
        } else {
            await this.engagementRepository.update(engagement.id, {
                lastTouchAt: now,
            });
        }

        return engagement;
    }

    // ✅ YENİ: Durum değişikliği için last touch
    async registerStatusChange(customerId: number, userId: number) {
        const now = new Date();

        const engagement = await this.engagementRepository.findActiveEngagement(
            customerId,
            undefined,
            userId,
        );

        if (engagement) {
            await this.engagementRepository.update(engagement.id, {
                lastTouchAt: now,
            });
        }

        return engagement;
    }

    async registerTouch(
        customerId: number,
        userId: number,
        role: CustomerEngagementRole,
    ) {
        const now = new Date();

        let engagement = await this.engagementRepository.findActiveEngagement(
            customerId,
            role,
            userId,
        );

        if (!engagement) {
            engagement = await this.startEngagement({
                customer: customerId,
                user: userId,
                role,
                assignedAt: now,
            } as any);
        }

        await this.engagementRepository.update(engagement.id, {
            firstTouchAt: engagement.firstTouchAt ?? now,
            lastTouchAt: now,
        });
    }

    async registerCall(dto: CreateCustomerCallLogDto, role: CustomerEngagementRole) {
        const now = dto.startedAt ?? new Date();

        let engagement = await this.engagementRepository.findActiveEngagement(
            dto.customer,
            role,
            dto.user,
        );

        if (!engagement) {
            engagement = await this.startEngagement({
                customer: dto.customer,
                user: dto.user,
                role,
                assignedAt: now,
            } as any);
        }

        if (!engagement.firstCallAt) {
            await this.engagementRepository.update(engagement.id, {
                firstCallAt: now,
                lastTouchAt: now,
            });
        }

        return this.callLogRepository.insertCallLog({
            customerId: dto.customer,
            userId: dto.user,
            engagementId: engagement.id,
            startedAt: now,
            endedAt: dto.endedAt,
            note: dto.note,
            direction: dto.direction,
        });
    }

    async getUserStats(
        userId: number,
        role: CustomerEngagementRole,
        startDate?: Date,
        endDate?: Date,
    ) {
        const engagements = await this.engagementRepository.findForUserStats(
            userId,
            role,
            startDate,
            endDate,
        );

        if (!engagements.length) {
            return {
                avgFirstTouchSeconds: null,
                avgOwnershipSeconds: null,
                totalEngagements: 0,
            };
        }

        const firstTouchDiffs: number[] = [];
        const ownershipDiffs: number[] = [];

        for (const e of engagements) {
            if (e.firstTouchAt) {
                firstTouchDiffs.push(
                    (e.firstTouchAt.getTime() - e.assignedAt.getTime()) / 1000,
                );
            }

            const end = e.releasedAt || e.lastTouchAt || new Date();
            ownershipDiffs.push((end.getTime() - e.assignedAt.getTime()) / 1000);
        }

        const avg = (arr: number[]) =>
            arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;

        return {
            avgFirstTouchSeconds: avg(firstTouchDiffs),
            avgOwnershipSeconds: avg(ownershipDiffs),
            totalEngagements: engagements.length,
        };
    }


    // ------------------------- API ----------------------------
    // ------------------------- API ----------------------------
    // ------------------------- API ----------------------------
    // ------------------------- API ----------------------------
    // ------------------------- API ----------------------------
    // ------------------------- API ----------------------------
    // ------------------------- API ----------------------------
    // ------------------------- API ----------------------------
    // ------------------------- API ----------------------------
    // ------------------------- API ----------------------------
    // ------------------------- API ----------------------------
    // ------------------------- API ----------------------------
    // ------------------------- API ----------------------------
    // ------------------------- API ----------------------------
    // ------------------------- API ----------------------------
    // ------------------------- API ----------------------------




    async getDashboardKpi(): Promise<DashboardKpiDto> {
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        // Active processes
        const activeEngagements = await this.engagementRepository.find({
            where: { releasedAt: IsNull() },
            relations: ['user'],
        });

        const salesActive = activeEngagements.filter(e => e.role === CustomerEngagementRole.SALES).length;
        const doctorActive = activeEngagements.filter(e => e.role === CustomerEngagementRole.DOCTOR).length;

        // Average first touch (last 30 days)
        const recentEngagements = await this.engagementRepository.find({
            where: {
                assignedAt: Between(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), now),
                firstTouchAt: Not(IsNull()), // ✅ Düzeltildi
            },
        });

        const avgFirstTouch = this.calculateAvgFirstTouch(recentEngagements);
        const avgFirstCall = this.calculateAvgFirstCall(recentEngagements);

        // Closed this week
        const closedThisWeek = await this.engagementRepository.count({
            where: {
                releasedAt: Between(weekAgo, now),
            },
        });

        return {
            activeProcesses: activeEngagements.length,
            salesActive,
            doctorActive,
            avgFirstTouchMinutes: avgFirstTouch,
            avgFirstCallMinutes: avgFirstCall,
            closedThisWeek,
        };
    }

    // ✅ User Performance List - DÜZELTİLMİŞ VERSİYON

    async getUserPerformanceList(period: 'week' | 'month' | 'all' = 'week'): Promise<UserPerformanceDto[]> {
        const now = new Date();
        const daysAgo = period === 'week' ? 7 : period === 'month' ? 30 : 365;
        const startDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

        const users = await this.engagementRepository.manager
            .getRepository(User)
            .createQueryBuilder('user')
            .where('user.role IN (:...roles)', { roles: ['user', 'doctor'] })
            .andWhere('user.isActive = :isActive', { isActive: true })
            .getMany();

        const userPerformances: UserPerformanceDto[] = [];

        for (const user of users) {
            const whereCondition: any = {
                user: { id: user.id },
            };

            // Period 'all' değilse tarih filtresi uygula
            if (period !== 'all') {
                whereCondition.assignedAt = Between(startDate, now);
            }

            const engagements = await this.engagementRepository.find({
                where: whereCondition,
                relations: ['customer'],
            });

            // Calculate stats
            const stats = this.calculateUserStats(engagements);

            // ✅ Aktif engagement'ları al - LIMIT 6
            const activeEngagements = await this.engagementRepository.find({
                where: {
                    user: { id: user.id },
                    releasedAt: IsNull(),
                },
                relations: ['customer'],
                order: {
                    assignedAt: 'DESC', // En yeni atananlar önce
                },
                take: 6, // ✅ Maksimum 6 aktif engagement
            });

            // ✅ Aktif engagement'ları DTO'ya çevir
            const activeEngagementsDto: ActiveEngagementDto[] = [];

            for (const activeEngagement of activeEngagements) {
                const elapsedSeconds = Math.floor(
                    (now.getTime() - activeEngagement.assignedAt.getTime()) / 1000
                );

                // Status name almak için ayrı sorgu
                let statusName = 'N/A';
                if (activeEngagement.customer.status) {
                    const status = await this.engagementRepository.manager
                        .getRepository(Status)
                        .findOne({
                            where: {
                                id: Number(activeEngagement.customer.status) // ✅ Number() ile çevir
                            }
                        });
                    statusName = status?.name || 'N/A';
                }

                activeEngagementsDto.push({
                    customerId: activeEngagement.customer.id,
                    customerName: `${activeEngagement.customer.name} ${activeEngagement.customer.surname}`,
                    status: statusName,
                    timer: this.formatTimer(elapsedSeconds),
                    phase: this.getEngagementPhase(activeEngagement),
                    assignedAt: activeEngagement.assignedAt,
                    lastTouchAt: activeEngagement.lastTouchAt,
                });
            }

            userPerformances.push({
                id: user.id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                role: user?.role == 'doctor' ? 'doctor' : 'sales',
                activeEngagements: activeEngagementsDto, // ✅ Artık array
                stats,
            });
        }

        return userPerformances;
    }

    // ✅ User History
    async getUserHistory(userId: number, limit: number = 20): Promise<EngagementHistoryDto[]> {
        const engagements = await this.engagementRepository.find({
            where: { user: { id: userId } },
            relations: ['customer', 'user'],
            order: { assignedAt: 'DESC' },
            take: limit,
        });

        return engagements.map((e: any) => this.mapToHistoryDto(e));
    }

    // ✅ Engagement Timeline
    async getEngagementTimeline(engagementId: number): Promise<EngagementTimelineEventDto[]> {
        const engagement = await this.findOneById(engagementId);
        if (!engagement) return [];

        const events: EngagementTimelineEventDto[] = [];

        // Event 1: Assigned
        events.push({
            id: 1,
            time: this.formatTime(engagement.assignedAt),
            type: 'assigned',
            title: 'ATANDI',
            description: `Kullanıcıya atandı`,
            icon: 'user-plus',
            color: 'blue',
        });

        // Event 2: First Touch
        if (engagement.firstTouchAt) {
            const duration = Math.floor(
                (engagement.firstTouchAt.getTime() - engagement.assignedAt.getTime()) / 60000
            );
            events.push({
                id: 2,
                time: this.formatTime(engagement.firstTouchAt),
                type: 'first_touch',
                title: 'İLK TEMAS',
                description: 'Profili görüntüledi',
                duration: `+${this.formatDuration(duration)}`,
                icon: 'eye',
                color: 'green',
                speed: this.getSpeed(duration, 'touch'),
            });
        }

        // Event 3: First Call
        if (engagement.firstCallAt) {
            const duration = Math.floor(
                (engagement.firstCallAt.getTime() - engagement.assignedAt.getTime()) / 60000
            );
            events.push({
                id: 3,
                time: this.formatTime(engagement.firstCallAt),
                type: 'first_call',
                title: 'İLK ARAMA',
                description: 'Telefon numarasını görüntüledi',
                duration: `+${this.formatDuration(duration)}`,
                icon: 'phone',
                color: 'amber',
                speed: this.getSpeed(duration, 'call'),
            });
        }

        // Event 4: Status changes from meta
        if (engagement.meta?.statusChanges) {
            engagement.meta.statusChanges.forEach((change: any, index: number) => {
                events.push({
                    id: events.length + 1,
                    time: this.formatTime(change.changedAt),
                    type: 'status_change',
                    title: 'DURUM DEĞİŞTİ',
                    description: `${change.oldStatusName} → ${change.newStatusName}`,
                    note: change.note,
                    icon: 'refresh',
                    color: 'purple',
                });
            });
        }

        // Event 5: Closed
        if (engagement.releasedAt) {
            const totalDuration = Math.floor(
                (engagement.releasedAt.getTime() - engagement.assignedAt.getTime()) / 60000
            );
            events.push({
                id: events.length + 1,
                time: this.formatTime(engagement.releasedAt),
                type: 'closed',
                title: 'KAPANDI',
                description: 'Engagement tamamlandı',
                duration: `Toplam: ${this.formatDuration(totalDuration)}`,
                icon: 'check-circle',
                color: 'green',
            });
        }

        return events;
    }

    // Helper methods - ✅ DÜZELTİLMİŞ (Ondalıklı sonuç)
    private calculateAvgFirstTouch(engagements: CustomerEngagement[]): number {
        const validEngagements = engagements.filter(e => e.firstTouchAt && e.assignedAt);
        if (validEngagements.length === 0) return 0;

        const totalMinutes = validEngagements.reduce((sum, e) => {
            const diff = (e.firstTouchAt.getTime() - e.assignedAt.getTime()) / 60000;
            return sum + diff;
        }, 0);

        // ✅ 1 ondalık basamak ile yuvarla
        return Math.round((totalMinutes / validEngagements.length) * 10) / 10;
    }

    private calculateAvgFirstCall(engagements: CustomerEngagement[]): number {
        const validEngagements = engagements.filter(e => e.firstCallAt && e.assignedAt);
        if (validEngagements.length === 0) return 0;

        const totalMinutes = validEngagements.reduce((sum, e) => {
            const diff = (e.firstCallAt.getTime() - e.assignedAt.getTime()) / 60000;
            return sum + diff;
        }, 0);

        // ✅ 1 ondalık basamak ile yuvarla
        return Math.round((totalMinutes / validEngagements.length) * 10) / 10;
    }

    // ✅ DÜZELTME 2: calculateUserStats metodunu iyileştir
    private calculateUserStats(engagements: CustomerEngagement[]): EngagementStatsDto {
        const totalCustomers = engagements.length;

        const avgFirstTouch = this.calculateAvgFirstTouch(engagements);

        const closedEngagements = engagements.filter(e => e.releasedAt && e.assignedAt);

        const avgClosing = closedEngagements.length > 0
            ? Math.round(
                (closedEngagements.reduce((sum, e) => {
                    const diff = (e.releasedAt.getTime() - e.assignedAt.getTime()) / 60000;
                    return sum + diff;
                }, 0) / closedEngagements.length) * 10
            ) / 10
            : 0;

        const activeCount = engagements.filter(e => !e.releasedAt).length;

        // ✅ Tüm kapatılan engagementlar = başarılı
        const conversionRate = totalCustomers > 0
            ? Math.round((closedEngagements.length / totalCustomers) * 100)
            : 0;

        return {
            totalCustomers,
            avgFirstTouchMinutes: avgFirstTouch,
            avgClosingMinutes: avgClosing,
            activeCount,
            conversionRate,
        };
    }


    private mapToHistoryDto(engagement: CustomerEngagement): EngagementHistoryDto {
        const durationInSeconds = engagement.releasedAt
            ? Math.floor((engagement.releasedAt.getTime() - engagement.assignedAt.getTime()) / 1000)
            : 0;

        const firstTouchMinutes = engagement.firstTouchAt
            ? Math.floor((engagement.firstTouchAt.getTime() - engagement.assignedAt.getTime()) / 60000)
            : 0;

        const firstCallMinutes = engagement.firstCallAt
            ? Math.floor((engagement.firstCallAt.getTime() - engagement.assignedAt.getTime()) / 60000)
            : 0;

        return {
            id: engagement.id,
            customerId: engagement.customer.id,
            customerName: `${engagement.customer.name} ${engagement.customer.surname}`,
            userId: engagement.user.id,
            userName: engagement.user.name,
            duration: this.formatDuration(durationInSeconds), // Formatlanmış string döndür
            durationInSeconds, // Ham değer de lazım olabilir
            firstTouchMinutes,
            firstCallMinutes,
            startDate: engagement.assignedAt,
            endDate: engagement.releasedAt || new Date(),
            status: engagement.releasedAt ? 'completed' : 'cancelled',
            result: engagement.meta?.finalStatus || 'N/A',
        };
    }

    private formatDuration(seconds: number): string {
        if (seconds === 0) return '0 dakika';

        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        const parts = [];

        if (hours > 0) {
            parts.push(`${hours} saat`);
        }
        if (minutes > 0) {
            parts.push(`${minutes} dakika`);
        }
        if (secs > 0 && hours === 0) { // Sadece saat yoksa saniyeyi göster
            parts.push(`${secs} saniye`);
        }

        return parts.join(' ') || '0 dakika';
    }

    private formatTimer(seconds: number): string {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    private formatTime(date: Date): string {
        return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    }


    private getSpeed(minutes: number, type: 'touch' | 'call'): 'fast' | 'normal' | 'slow' {
        const thresholds = type === 'touch'
            ? { fast: 120, normal: 360 }
            : { fast: 180, normal: 480 };

        if (minutes < thresholds.fast) return 'fast';
        if (minutes < thresholds.normal) return 'normal';
        return 'slow';
    }

    private getEngagementPhase(engagement: CustomerEngagement): string {
        if (!engagement.firstTouchAt) return 'Henüz temas yok';
        if (!engagement.firstCallAt) return 'İlk temas yapıldı';
        return 'Arama yapıldı';
    }


}