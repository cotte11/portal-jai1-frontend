import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { ProfileService } from '../../core/services/profile.service';
import { ProfileResponse, ClientStatus } from '../../core/models';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {
  private router = inject(Router);
  private authService = inject(AuthService);
  private profileService = inject(ProfileService);

  profileData: ProfileResponse | null = null;
  isLoading: boolean = true;
  errorMessage: string = '';
  currentStep: number = 1;

  // Status display mapping
  statusLabels: Record<ClientStatus, string> = {
    [ClientStatus.ESPERANDO_DATOS]: 'Necesitamos tus datos y documentos',
    [ClientStatus.CUENTA_EN_REVISION]: 'Estamos revisando tu informacion',
    [ClientStatus.TAXES_EN_PROCESO]: 'Estamos trabajando en tu declaracion!',
    [ClientStatus.TAXES_EN_CAMINO]: 'Tu reembolso esta en camino',
    [ClientStatus.TAXES_DEPOSITADOS]: 'Reembolso depositado en tu cuenta!',
    [ClientStatus.PAGO_REALIZADO]: 'Gracias por tu pago',
    [ClientStatus.EN_VERIFICACION]: 'El IRS esta verificando tu caso',
    [ClientStatus.TAXES_FINALIZADOS]: 'Proceso completado! Gracias por confiar en JAI1'
  };

  // Map client status to step number
  statusToStep: Record<ClientStatus, number> = {
    [ClientStatus.ESPERANDO_DATOS]: 1,
    [ClientStatus.CUENTA_EN_REVISION]: 2,
    [ClientStatus.TAXES_EN_PROCESO]: 2,
    [ClientStatus.TAXES_EN_CAMINO]: 3,
    [ClientStatus.EN_VERIFICACION]: 3,
    [ClientStatus.TAXES_DEPOSITADOS]: 4,
    [ClientStatus.PAGO_REALIZADO]: 4,
    [ClientStatus.TAXES_FINALIZADOS]: 4
  };

  ngOnInit() {
    this.loadProfileData();
  }

  get progressPercent(): number {
    return Math.min(this.currentStep * 25, 100);
  }

  isStepCompleted(step: number): boolean {
    return step < this.currentStep;
  }

  isStepActive(step: number): boolean {
    return step === this.currentStep;
  }

  loadProfileData() {
    this.profileService.getProfile().subscribe({
      next: (data) => {
        this.profileData = data;
        this.isLoading = false;
        
        // Update current step based on client status
        if (data?.taxCase?.clientStatus) {
          this.currentStep = this.statusToStep[data.taxCase.clientStatus] || 1;
        }
      },
      error: (error) => {
        this.errorMessage = error.message || 'Error al cargar perfil';
        this.isLoading = false;
      }
    });
  }

  get currentStatus(): string {
    if (this.profileData?.taxCase) {
      return this.statusLabels[this.profileData.taxCase.clientStatus] || 'Estado desconocido';
    }
    return 'Completa tu perfil para comenzar';
  }

  get estimatedRefund(): number | null {
    return this.profileData?.taxCase?.estimatedRefund || null;
  }

  get isProfileComplete(): boolean {
    return this.profileData?.profile?.profileComplete || false;
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
  }
}
