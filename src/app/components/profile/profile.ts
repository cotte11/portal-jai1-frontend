import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ProfileService } from '../../core/services/profile.service';
import { ProfileResponse, Address } from '../../core/models';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class Profile implements OnInit {
  private router = inject(Router);
  private authService = inject(AuthService);
  private profileService = inject(ProfileService);

  // User data
  userName: string = '';
  userEmail: string = '';
  userPhone: string = '';
  profilePicture: string | null = null;
  
  // Profile data
  dni: string = '';
  dateOfBirth: string = '';
  isVerified: boolean = false;
  
  // Address
  address: Address = {
    street: '',
    city: '',
    state: '',
    zip: ''
  };

  // UI State
  isLoading: boolean = true;
  isEditing: boolean = false;
  isSaving: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

  // Edit form data
  editForm = {
    firstName: '',
    lastName: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    zip: ''
  };

  ngOnInit() {
    this.loadProfile();
  }

  get userInitials(): string {
    if (this.userName) {
      const parts = this.userName.trim().split(' ');
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return this.userName.substring(0, 2).toUpperCase();
    }
    return this.userEmail ? this.userEmail.substring(0, 2).toUpperCase() : 'U';
  }

  loadProfile() {
    this.isLoading = true;
    
    const user = this.authService.currentUser;
    if (user) {
      this.userName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
      this.userEmail = user.email;
      this.userPhone = user.phone || '';
      
      // Initialize edit form
      this.editForm.firstName = user.firstName || '';
      this.editForm.lastName = user.lastName || '';
      this.editForm.phone = user.phone || '';
    }

    this.profileService.getProfile().subscribe({
      next: (response: ProfileResponse) => {
        if (response.profile) {
          this.dni = response.profile.ssn || '';
          this.dateOfBirth = response.profile.dateOfBirth || '';
          this.isVerified = response.profile.profileComplete || false;
          
          if (response.profile.address) {
            this.address = response.profile.address;
            this.editForm.street = response.profile.address.street || '';
            this.editForm.city = response.profile.address.city || '';
            this.editForm.state = response.profile.address.state || '';
            this.editForm.zip = response.profile.address.zip || '';
          }
        }
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });

    // Load profile picture from localStorage
    const savedPicture = localStorage.getItem('profilePicture');
    if (savedPicture) {
      this.profilePicture = savedPicture;
    }
  }

  triggerFileInput() {
    const fileInput = document.getElementById('profilePictureInput') as HTMLInputElement;
    fileInput?.click();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        this.errorMessage = 'Por favor selecciona una imagen válida';
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.errorMessage = 'La imagen no puede superar los 5MB';
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        this.profilePicture = result;
        // Save to localStorage for persistence
        localStorage.setItem('profilePicture', result);
        this.successMessage = '¡Foto de perfil actualizada!';
        setTimeout(() => this.successMessage = '', 3000);
      };
      reader.readAsDataURL(file);
    }
  }

  removeProfilePicture() {
    this.profilePicture = null;
    localStorage.removeItem('profilePicture');
    this.successMessage = 'Foto de perfil eliminada';
    setTimeout(() => this.successMessage = '', 3000);
  }

  toggleEdit() {
    this.isEditing = !this.isEditing;
    this.errorMessage = '';
    this.successMessage = '';
  }

  saveChanges() {
    // For now, just save to local state
    // In a real app, this would call an API
    this.isSaving = true;
    
    setTimeout(() => {
      this.userName = `${this.editForm.firstName} ${this.editForm.lastName}`.trim();
      this.userPhone = this.editForm.phone;
      this.address = {
        street: this.editForm.street,
        city: this.editForm.city,
        state: this.editForm.state,
        zip: this.editForm.zip
      };
      
      this.isSaving = false;
      this.isEditing = false;
      this.successMessage = '¡Cambios guardados correctamente!';
      setTimeout(() => this.successMessage = '', 3000);
    }, 800);
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return 'No especificada';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    });
  }

  maskDNI(dni: string): string {
    if (!dni || dni.length < 4) return dni || 'No especificado';
    return '••••••' + dni.slice(-4);
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }
}

