'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const steps = [
  { number: 1, title: 'Account', description: 'Create your account' },
  { number: 2, title: 'Gym Info', description: 'Basic gym information' },
  { number: 3, title: 'Location', description: 'Where is your gym?' },
  { number: 4, title: 'Contact', description: 'Contact details' },
  { number: 5, title: 'Documents', description: 'Verification documents' },
];

// Step 1: Account
const accountSchema = z.object({
  fullName: z.string().min(2, 'Name required'),
  email: z.string().email('Valid email required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// Step 2: Gym Info
const gymInfoSchema = z.object({
  gymName: z.string().min(3, 'Gym name required'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
});

// Step 3: Location
const locationSchema = z.object({
  address: z.string().min(5, 'Address required'),
  city: z.string().min(2, 'City required'),
  country: z.string().min(2, 'Country required'),
  postalCode: z.string().min(2, 'Postal code required'),
});

// Step 4: Contact
const contactSchema = z.object({
  phone: z.string().min(10, 'Phone number required'),
  website: z.string().url('Valid URL required').optional().or(z.literal('')),
  instagram: z.string().optional(),
  facebook: z.string().optional(),
});

type AccountFormData = z.infer<typeof accountSchema>;
type GymInfoFormData = z.infer<typeof gymInfoSchema>;
type LocationFormData = z.infer<typeof locationSchema>;
type ContactFormData = z.infer<typeof contactSchema>;

export default function RegisterGymPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [accountData, setAccountData] = useState<AccountFormData | null>(null);
  const [gymInfoData, setGymInfoData] = useState<GymInfoFormData | null>(null);
  const [locationData, setLocationData] = useState<LocationFormData | null>(null);
  const [contactData, setContactData] = useState<ContactFormData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1
  const accountForm = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
  });

  const onAccountSubmit = (data: AccountFormData) => {
    setAccountData(data);
    setCurrentStep(2);
  };

  // Step 2
  const gymInfoForm = useForm<GymInfoFormData>({
    resolver: zodResolver(gymInfoSchema),
  });

  const onGymInfoSubmit = (data: GymInfoFormData) => {
    setGymInfoData(data);
    setCurrentStep(3);
  };

  // Step 3
  const locationForm = useForm<LocationFormData>({
    resolver: zodResolver(locationSchema),
  });

  const onLocationSubmit = (data: LocationFormData) => {
    setLocationData(data);
    setCurrentStep(4);
  };

  // Step 4
  const contactForm = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  });

  const onContactSubmit = (data: ContactFormData) => {
    setContactData(data);
    setCurrentStep(5);
  };

  // Step 5: Submit
  const handleFinalSubmit = async () => {
    if (!accountData || !gymInfoData || !locationData || !contactData) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/register-gym-owner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          fullName: accountData.fullName,
          email: accountData.email,
          password: accountData.password,
          gym: {
            name: gymInfoData.gymName,
            description: gymInfoData.description,
            address: locationData.address,
            city: locationData.city,
            country: locationData.country,
            postalCode: locationData.postalCode,
            phone: contactData.phone,
            website: contactData.website,
            socialMedia: {
              instagram: contactData.instagram,
              facebook: contactData.facebook,
            },
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Registration failed');
      }

      router.push('/gym-owner');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Steps Indicator */}
        <div className="mb-8">
          <div className="flex justify-between">
            {steps.map((step) => (
              <div key={step.number} className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                    currentStep >= step.number
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-300 text-gray-600'
                  }`}
                >
                  {currentStep > step.number ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    step.number
                  )}
                </div>
                <p className="text-xs mt-2 text-gray-600 text-center">{step.title}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 h-1 bg-gray-300 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all"
              style={{ width: `${(currentStep / steps.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Card */}
        <Card>
          <CardHeader>
            <CardTitle>{steps[currentStep - 1].title}</CardTitle>
            <CardDescription>{steps[currentStep - 1].description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            {/* Step 1: Account */}
            {currentStep === 1 && (
              <form onSubmit={accountForm.handleSubmit(onAccountSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                  <Input {...accountForm.register('fullName')} placeholder="Your Name" />
                  {accountForm.formState.errors.fullName && (
                    <p className="text-red-600 text-sm mt-1">
                      {accountForm.formState.errors.fullName.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                  <Input {...accountForm.register('email')} type="email" placeholder="you@example.com" />
                  {accountForm.formState.errors.email && (
                    <p className="text-red-600 text-sm mt-1">
                      {accountForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
                  <Input {...accountForm.register('password')} type="password" />
                  {accountForm.formState.errors.password && (
                    <p className="text-red-600 text-sm mt-1">
                      {accountForm.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password *
                  </label>
                  <Input {...accountForm.register('confirmPassword')} type="password" />
                  {accountForm.formState.errors.confirmPassword && (
                    <p className="text-red-600 text-sm mt-1">
                      {accountForm.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <Button type="submit" className="w-full">
                  Next <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </form>
            )}

            {/* Step 2: Gym Info */}
            {currentStep === 2 && (
              <form onSubmit={gymInfoForm.handleSubmit(onGymInfoSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Gym Name *</label>
                  <Input {...gymInfoForm.register('gymName')} placeholder="Your Gym Name" />
                  {gymInfoForm.formState.errors.gymName && (
                    <p className="text-red-600 text-sm mt-1">
                      {gymInfoForm.formState.errors.gymName.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                  <textarea
                    {...gymInfoForm.register('description')}
                    placeholder="Tell us about your gym..."
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={4}
                  />
                  {gymInfoForm.formState.errors.description && (
                    <p className="text-red-600 text-sm mt-1">
                      {gymInfoForm.formState.errors.description.message}
                    </p>
                  )}
                </div>

                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep(1)}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button type="submit" className="flex-1">
                    Next <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </form>
            )}

            {/* Step 3: Location */}
            {currentStep === 3 && (
              <form onSubmit={locationForm.handleSubmit(onLocationSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address *</label>
                  <Input {...locationForm.register('address')} placeholder="Street Address" />
                  {locationForm.formState.errors.address && (
                    <p className="text-red-600 text-sm mt-1">
                      {locationForm.formState.errors.address.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
                    <Input {...locationForm.register('city')} placeholder="City" />
                    {locationForm.formState.errors.city && (
                      <p className="text-red-600 text-sm mt-1">
                        {locationForm.formState.errors.city.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Country *</label>
                    <Input {...locationForm.register('country')} placeholder="Country" />
                    {locationForm.formState.errors.country && (
                      <p className="text-red-600 text-sm mt-1">
                        {locationForm.formState.errors.country.message}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Postal Code *</label>
                  <Input {...locationForm.register('postalCode')} placeholder="12345" />
                  {locationForm.formState.errors.postalCode && (
                    <p className="text-red-600 text-sm mt-1">
                      {locationForm.formState.errors.postalCode.message}
                    </p>
                  )}
                </div>

                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep(2)}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button type="submit" className="flex-1">
                    Next <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </form>
            )}

            {/* Step 4: Contact */}
            {currentStep === 4 && (
              <form onSubmit={contactForm.handleSubmit(onContactSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone *</label>
                  <Input {...contactForm.register('phone')} placeholder="+1234567890" />
                  {contactForm.formState.errors.phone && (
                    <p className="text-red-600 text-sm mt-1">
                      {contactForm.formState.errors.phone.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                  <Input
                    {...contactForm.register('website')}
                    type="url"
                    placeholder="https://example.com"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Instagram</label>
                    <Input {...contactForm.register('instagram')} placeholder="@instagram" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Facebook</label>
                    <Input {...contactForm.register('facebook')} placeholder="facebook.com/..." />
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep(3)}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button type="submit" className="flex-1">
                    Next <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </form>
            )}

            {/* Step 5: Documents */}
            {currentStep === 5 && (
              <div className="space-y-4">
                <p className="text-gray-600">
                  Please upload verification documents (business registration, gym photos, licenses) to get your gym verified.
                </p>

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <p className="text-gray-600 mb-4">Drag and drop files here or click to upload</p>
                  <Button variant="outline">Choose Files</Button>
                </div>

                <p className="text-sm text-gray-500">
                  You can also upload documents later from your gym dashboard.
                </p>

                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep(4)}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    onClick={handleFinalSubmit}
                    disabled={isSubmitting}
                    className="flex-1"
                  >
                    {isSubmitting ? 'Creating account...' : 'Create Account'}
                  </Button>
                </div>
              </div>
            )}

            {/* Login Link */}
            <p className="text-center text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/login" className="text-blue-600 hover:underline">
                Log in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
