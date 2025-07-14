import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { router, useForm } from '@inertiajs/react';
import clsx from 'clsx';
import { MapPin, Upload, X } from 'lucide-react';
import { useRef, useState } from 'react';

interface Plan {
    id: number;
    name: string;
    description: string;
    price: {
        monthly: number;
        yearly: number;
    };
    max_servers: number;
    max_organizations: number;
    max_metrics: number;
    frequency: number;
    is_active: boolean;
}

interface OrganizationFormProps {
    selectedPlan: Plan;
    billingCycle: 'monthly' | 'yearly';
    onBack: () => void;
}

// Liste des pays
const countries = [
    { code: 'US', name: 'United States' },
    { code: 'CA', name: 'Canada' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'FR', name: 'France' },
    { code: 'DE', name: 'Germany' },
    { code: 'ES', name: 'Spain' },
    { code: 'IT', name: 'Italy' },
    { code: 'NL', name: 'Netherlands' },
    { code: 'BE', name: 'Belgium' },
    { code: 'AU', name: 'Australia' },
    { code: 'JP', name: 'Japan' },
    { code: 'BR', name: 'Brazil' },
    { code: 'MX', name: 'Mexico' },
    { code: 'IN', name: 'India' },
    { code: 'CN', name: 'China' },
    // Ajouter plus de pays selon les besoins
];

export default function OrganizationForm({ selectedPlan, billingCycle, onBack }: OrganizationFormProps) {
    const { data, setData, post, processing, errors, progress } = useForm({
        name: '',
        description: '',
        logo: null as File | null,
        plan_id: selectedPlan.id,
        billing_period: billingCycle,
        organization_type: 'company',
        billing_address: {
            street: '',
            street_line_2: '',
            city: '',
            state: '',
            postal_code: '',
            country: '',
            formatted: '',
        },
        tax_number: '',
    });

    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
    const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Préparer les données pour l'envoi - billing_address reste un objet JSON
        const submitData = {
            ...data,
            // Garder billing_address comme objet JSON
            billing_address: data.billing_address
        };
        
        post(route('organizations.store'), {
            ...submitData,
            forceFormData: true,
            onSuccess: () => {
                // Redirection vers ajout de serveur sera gérée par le serveur
            },
        });
    };

    const handleFile = (file: File) => {
        // Vérifier le type de fichier
        if (!file.type.startsWith('image/')) {
            alert('Veuillez sélectionner un fichier image.');
            return;
        }

        // Vérifier la taille (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            alert('Le fichier doit faire moins de 2MB.');
            return;
        }

        setData('logo', file);

        // Créer un aperçu
        const reader = new FileReader();
        reader.onload = (e) => {
            setLogoPreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFile(file);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);

        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            handleFile(files[0]);
        }
    };

    // Autocomplétion d'adresses avec Nominatim (OpenStreetMap)
    const handleAddressSearch = async (query: string) => {
        if (query.length > 3) {
            setIsLoadingSuggestions(true);
            try {
                // Utilisation de Nominatim (gratuit) - peut être remplacé par Google Places API
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&q=${encodeURIComponent(query)}`,
                );
                const data = await response.json();

                const suggestions = data.map((item: any) => ({
                    display_name: item.display_name,
                    address: item.address || {},
                    formatted: item.display_name,
                }));

                setAddressSuggestions(suggestions);
                setShowSuggestions(true);
            } catch (error) {
                console.error("Erreur lors de la recherche d'adresse:", error);
                setAddressSuggestions([]);
            } finally {
                setIsLoadingSuggestions(false);
            }
        } else {
            setShowSuggestions(false);
            setAddressSuggestions([]);
        }
    };

    const selectAddressSuggestion = (suggestion: any) => {
        // Parser l'adresse depuis Nominatim
        const addr = suggestion.address;

        setData((prev) => ({
            ...prev,
            billing_address: {
                street: addr.house_number && addr.road ? `${addr.house_number} ${addr.road}` : addr.road || '',
                street_line_2: '',
                city: addr.city || addr.town || addr.village || addr.municipality || '',
                state: addr.state || addr.region || '',
                postal_code: addr.postcode || '',
                country: addr.country || '',
                formatted: suggestion.display_name,
            },
        }));
        setShowSuggestions(false);
        setIsAddressModalOpen(true);
    };

    const updateAddressField = (field: string, value: string) => {
        setData((prev) => ({
            ...prev,
            billing_address: {
                ...prev.billing_address,
                [field]: value,
            },
        }));
    };

    const getPlanPrice = () => {
        return billingCycle === 'monthly' ? selectedPlan.price.monthly : selectedPlan.price.yearly;
    };
    
    const saveAddress = () => {
        // Créer l'adresse formatée
        const formatted = `${data.billing_address.street}${data.billing_address.street_line_2 ? ', ' + data.billing_address.street_line_2 : ''}, ${data.billing_address.city}, ${data.billing_address.state ? data.billing_address.state + ', ' : ''}${data.billing_address.postal_code}, ${countries.find((c) => c.code === data.billing_address.country)?.name || data.billing_address.country}`;

        setData((prev) => ({
            ...prev,
            billing_address: {
                ...prev.billing_address,
                formatted,
            },
        }));
        setIsAddressModalOpen(false);
    };

    const removeLogo = () => {
        setData('logo', null);
        setLogoPreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    return (
        <>
            <div className="fixed top-8 left-8 z-50 flex gap-2">
                <button
                    onClick={() => router.visit('/dashboard')}
                    className="hover:bg-accent hover:text-accent-foreground flex size-8 cursor-pointer items-center justify-center rounded-full border border-white/5 bg-white/5 text-white"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20" width="20" height="20">
                        <path
                            fill-rule="evenodd"
                            d="M4.558 4.558a.625.625 0 0 1 .884 0L10 9.116l4.558-4.558a.625.625 0 1 1 .884.884L10.884 10l4.558 4.558a.625.625 0 1 1-.884.884L10 10.884l-4.558 4.558a.625.625 0 1 1-.884-.884L9.116 10 4.558 5.442a.625.625 0 0 1 0-.884Z"
                            clip-rule="evenodd"
                            fill="currentColor"
                        ></path>
                    </svg>
                </button>
                <button
                    onClick={onBack}
                    className="hover:bg-accent hover:text-accent-foreground flex size-8 items-center justify-center rounded-full border border-white/5 bg-white/5 text-white"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20" width="20" height="20">
                        <path
                            stroke="currentColor"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M8.333 4.583 2.917 10l5.416 5.417m-5-5.417h13.75"
                        ></path>
                    </svg>
                </button>
            </div>
            {/* Formulaire */}
            <div className="relative max-w-full space-y-10 py-24">
                <div className="text-card-foreground motion-preset-blur-up motion-delay-200 mt-6 flex flex-col divide-x divide-neutral-700 rounded-lg border border-neutral-700 bg-neutral-800 p-0 shadow-2xl max-md:mt-12 md:flex md:flex-row">
                    <div className="flex w-full max-w-[600px] flex-col justify-center gap-8 p-10 md:min-w-[550px]">
                        <div className="flex flex-col gap-1">
                            <div className="text-xl font-semibold">Create Organization</div>
                            <div className="text-neutral-300">Provide your organization details.</div>
                        </div>
                        <div className="flex h-14 items-center justify-between gap-4 rounded-lg border border-white/10 bg-white/2 pr-3 pl-4">
                            <div className="flex flex-col">
                                <h4 className="text-sm leading-tight">{selectedPlan.name} Plan</h4>
                            </div>
                            <div className="flex items-center gap-4">
                                <p className="text-sm leading-tight text-white">
                                    {getPlanPrice() === 0 ? '$0.00' : `€${getPlanPrice()}`} per {billingCycle === 'monthly' ? 'month' : 'year'}
                                </p>
                                <button
                                    onClick={onBack}
                                    className="ring-offset-background border-input text-secondary-foreground inline-flex h-8 items-center justify-center gap-2 rounded-md border bg-white/5 px-3 text-sm leading-tight whitespace-nowrap transition-colors hover:bg-neutral-700 focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:outline-none active:translate-y-px active:bg-neutral-700 disabled:pointer-events-none disabled:opacity-50"
                                >
                                    Change
                                </button>
                            </div>
                        </div>
                        <form id="organization-form" onSubmit={handleSubmit} className="flex flex-col gap-6">
                            <div className="flex w-full gap-4 max-md:flex-col">
                                <div className="flex w-full flex-col gap-3">
                                    <div className="flex items-center justify-between gap-2">
                                        <label className="text-sm/none leading-none text-neutral-300 peer-focus:text-white peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                            Organization name
                                        </label>
                                    </div>
                                    <div className="input relative flex w-full items-center">
                                        <Input
                                            id="name"
                                            type="text"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            placeholder="Ex: Mon Entreprise, Équipe Dev, etc."
                                            required
                                            className={clsx(
                                                'border-input ring-offset-background flex h-11 w-full rounded-lg border bg-white/5 px-3.5 py-2 text-sm text-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-white/40 read-only:text-neutral-300 read-only:[caret-color:transparent] read-only:!ring-0 read-only:placeholder:text-white/20 hover:border-white/10 focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
                                                errors.name ? 'border-red-500' : '',
                                            )}
                                        />
                                        {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
                                    </div>
                                </div>
                                <div className="flex w-full flex-col gap-3">
                                    <div className="flex items-center justify-between gap-2">
                                        <label className="text-sm/none leading-none text-neutral-300 peer-focus:text-white peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                            Icon
                                        </label>
                                    </div>
                                    <div>
                                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                                        <div className="flex items-start gap-2">
                                            <div className="flex items-center gap-3">
                                                {logoPreview ? (
                                                    <div className="relative">
                                                        <img
                                                            src={logoPreview}
                                                            alt="Aperçu du logo"
                                                            className="h-20 w-20 rounded-lg border-2 border-dashed border-gray-300 object-cover"
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="destructive"
                                                            size="sm"
                                                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                                                            onClick={removeLogo}
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <div
                                                        className={clsx(
                                                            'flex h-20 w-20 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed transition-colors',
                                                            isDragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400',
                                                        )}
                                                        onClick={triggerFileInput}
                                                        onDragOver={handleDragOver}
                                                        onDragLeave={handleDragLeave}
                                                        onDrop={handleDrop}
                                                    >
                                                        <Upload className="h-8 w-8 text-gray-400" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex w-full flex-col gap-3">
                                <div className="flex items-center justify-between gap-2">
                                    <label className="text-sm/none leading-none text-neutral-300 peer-focus:text-white peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                        Organization type
                                    </label>
                                </div>
                                <div className="input relative flex w-full items-center">
                                    <Select value={data.organization_type} onValueChange={(value) => setData('organization_type', value)}>
                                        <SelectTrigger className="border-input ring-offset-background flex h-11 w-full items-center justify-between rounded-lg border bg-white/5 px-3 py-2 text-sm text-white hover:border-white/10 focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:outline-none">
                                            <SelectValue placeholder="Select organization type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="company">Company</SelectItem>
                                            <SelectItem value="individual">Individual</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="flex w-full flex-col gap-3">
                                <div className="flex items-center justify-between gap-2">
                                    <label className="text-sm/none leading-none text-neutral-300 peer-focus:text-white peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                        Billing address
                                    </label>
                                </div>
                                <div className="input relative flex w-full items-center">
                                    <div className="relative w-full">
                                        <Input
                                            id="billing_address"
                                            value={data.billing_address.formatted}
                                            onChange={(e) => {
                                                updateAddressField('formatted', e.target.value);
                                                const value = e.target.value;
                                                // Debounce la recherche
                                                if (searchTimeoutRef.current) {
                                                    clearTimeout(searchTimeoutRef.current);
                                                }
                                                searchTimeoutRef.current = setTimeout(() => {
                                                    handleAddressSearch(value);
                                                }, 300);
                                            }}
                                            onFocus={() => {
                                                if (data.billing_address.formatted.length > 3) {
                                                    setShowSuggestions(true);
                                                }
                                            }}
                                            onBlur={() => {
                                                // Délai pour permettre le clic sur les suggestions
                                                setTimeout(() => setShowSuggestions(false), 150);
                                            }}
                                            placeholder="Enter business address"
                                            required
                                            className={clsx(
                                                'border-input ring-offset-background flex h-11 w-full rounded-lg border bg-white/5 px-3.5 py-2 text-sm text-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-white/40 read-only:text-neutral-300 read-only:[caret-color:transparent] read-only:!ring-0 read-only:placeholder:text-white/20 hover:border-white/10 focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
                                                errors.billing_address ? 'border-red-500' : '',
                                            )}
                                        />

                                        {/* Suggestions dropdown */}
                                        {(showSuggestions || isLoadingSuggestions) && (
                                            <div className="absolute top-full right-0 left-0 z-10 mt-1 max-h-60 overflow-y-auto rounded-lg border border-white/10 bg-neutral-800 shadow-lg">
                                                {isLoadingSuggestions ? (
                                                    <div className="px-3 py-4 text-center text-sm text-neutral-400">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                                            Searching addresses...
                                                        </div>
                                                    </div>
                                                ) : addressSuggestions.length > 0 ? (
                                                    addressSuggestions.map((suggestion, index) => (
                                                        <button
                                                            key={index}
                                                            type="button"
                                                            className="flex w-full items-start gap-2 border-b border-white/5 px-3 py-3 text-left text-sm text-white first:rounded-t-lg last:rounded-b-lg last:border-b-0 hover:bg-white/5"
                                                            onClick={() => selectAddressSuggestion(suggestion)}
                                                        >
                                                            <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-neutral-400" />
                                                            <div className="flex-1">
                                                                <div className="text-white">{suggestion.formatted}</div>
                                                            </div>
                                                        </button>
                                                    ))
                                                ) : (
                                                    <div className="px-3 py-4 text-center text-sm text-neutral-400">No addresses found</div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    {errors.billing_address && <p className="text-sm text-red-600">{errors.billing_address}</p>}
                                </div>

                                {/* Manual address entry button */}
                                <div className="flex justify-end">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setIsAddressModalOpen(true)}
                                        className="ring-offset-background border-input text-secondary-foreground border bg-white/5 text-xs hover:bg-neutral-700"
                                    >
                                        Enter address manually
                                    </Button>
                                </div>
                            </div>

                            <div className="flex w-full flex-col gap-3">
                                <div className="flex items-center justify-between gap-2">
                                    <label
                                        className="text-sm/none leading-none text-neutral-300 peer-focus:text-white peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        htmlFor="tax_number"
                                    >
                                        Tax identification number
                                    </label>
                                    <p className="text-sm/none text-neutral-400">Optional</p>
                                </div>
                                <div className="input relative flex w-full items-center">
                                    <Input
                                        id="tax_number"
                                        value={data.tax_number}
                                        onChange={(e) => setData('tax_number', e.target.value)}
                                        placeholder="Enter your tax number"
                                        className={clsx(
                                            'border-input ring-offset-background flex h-11 w-full rounded-lg border bg-white/5 px-3.5 py-2 text-sm text-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-white/40 read-only:text-neutral-300 read-only:[caret-color:transparent] read-only:!ring-0 read-only:placeholder:text-white/20 hover:border-white/10 focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
                                            errors.tax_number ? 'border-red-500' : '',
                                        )}
                                    />
                                    {errors.tax_number && <p className="text-sm text-red-600">{errors.tax_number}</p>}
                                </div>
                            </div>

                            {/* Only show submit button for Free plan */}
                            {getPlanPrice() === 0 && (
                                <div className="flex justify-end gap-4 pt-6">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={onBack}
                                        disabled={processing}
                                        className="ring-offset-background border-input text-secondary-foreground inline-flex h-10 items-center justify-center gap-2 rounded-md border bg-white/5 px-4 text-sm leading-tight whitespace-nowrap transition-colors hover:bg-neutral-700 focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
                                    >
                                        Back
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={processing || !data.name.trim()}
                                        className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
                                    >
                                        {processing ? (
                                            <>
                                                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                                Creating...
                                            </>
                                        ) : (
                                            'Create Organization'
                                        )}
                                    </Button>
                                </div>
                            )}

                            {progress && (
                                <div className="mt-4">
                                    <div className="mb-1 flex justify-between text-sm text-white">
                                        <span>Upload in progress...</span>
                                        <span>{Math.round(progress.percentage || 0)}%</span>
                                    </div>
                                    <div className="h-2 w-full rounded-full bg-white/20">
                                        <div
                                            className="h-2 rounded-full bg-blue-600 transition-all duration-300"
                                            style={{ width: `${progress.percentage || 0}%` }}
                                        />
                                    </div>
                                </div>
                            )}
                        </form>
                    </div>

                    {/* Payment Details Section for Pro/Business Plans */}
                    {getPlanPrice() > 0 && (
                        <div className="flex w-full flex-col gap-6 bg-white/3 p-10 md:min-w-[550px]">
                            <div className="flex flex-col gap-2">
                                <div className="text-xl font-semibold">Payment Details</div>
                                <div className="text-sm text-neutral-400">Complete your subscription to {selectedPlan.name} plan</div>
                            </div>

                            {/* Stripe Payment Element Placeholder */}
                            <div className="flex flex-col gap-4">
                                <div className="rounded-lg border border-neutral-700 bg-neutral-800 p-4">
                                    <div className="py-8 text-center text-sm text-neutral-400">
                                        Payment form will be integrated here
                                        <br />
                                        (Stripe Elements)
                                    </div>
                                </div>

                                {/* Coupon Code */}
                                <div className="flex flex-col gap-2">
                                    <div className="relative">
                                        <Input
                                            type="text"
                                            placeholder="Enter coupon code"
                                            className="border-input ring-offset-background flex h-11 w-full rounded-lg border bg-white/5 px-3.5 py-2 pr-20 text-sm text-white placeholder:text-white/40 hover:border-white/10 focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:outline-none"
                                        />
                                        <button
                                            className="border-input absolute top-1.5 right-1.5 z-10 inline-flex h-8 items-center justify-center gap-2 rounded-md border bg-white/5 px-3 text-sm leading-tight text-neutral-400 transition-colors hover:bg-neutral-700"
                                            disabled
                                        >
                                            Verify
                                        </button>
                                    </div>
                                </div>

                                {/* Pricing Summary */}
                                <div className="flex flex-col divide-y divide-neutral-700 rounded-lg border border-neutral-700 text-sm font-semibold">
                                    <div className="flex items-center justify-between p-4">
                                        <div>Subtotal</div>
                                        <div className="flex items-center gap-6">€{getPlanPrice()}.00</div>
                                    </div>
                                    <div className="flex items-center justify-between p-4">
                                        <div>Taxes</div>
                                        <div className="flex items-center gap-6">
                                            <span className="cursor-pointer font-normal text-blue-400">Update address</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between p-4">
                                        <div>Total</div>
                                        <div className="flex items-center gap-6">€{getPlanPrice()}.00</div>
                                    </div>
                                </div>

                                {/* Pay Button */}
                                <Button
                                    type="submit"
                                    form="organization-form"
                                    disabled={processing || !data.name.trim()}
                                    className="mt-3 h-11 w-full rounded-lg border border-blue-500 bg-blue-600 text-blue-100 hover:bg-blue-600/90 active:bg-blue-700"
                                >
                                    {processing ? (
                                        <>
                                            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                            Processing...
                                        </>
                                    ) : (
                                        `Pay €${getPlanPrice()}.00`
                                    )}
                                </Button>

                                {/* Powered by Stripe */}
                                <div className="flex w-full flex-col items-center justify-center gap-5">
                                    <svg width="96" height="17" viewBox="0 0 96 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path
                                            opacity="0.502"
                                            fillRule="evenodd"
                                            clipRule="evenodd"
                                            d="M48.7838 13.8415H47.5625L48.5077 11.4994L46.6267 6.73641H47.9172L49.0991 9.97811L50.2904 6.73641H51.5809L48.7838 13.8415ZM44.0953 11.7962C43.6723 11.7962 43.238 11.6384 42.845 11.3313V11.6778H41.5844V4.57184H42.845V7.0726C43.238 6.77585 43.6723 6.61809 44.0953 6.61809C45.4148 6.61809 46.3207 7.68488 46.3207 9.20712C46.3207 10.7284 45.4148 11.7962 44.0953 11.7962ZM43.8295 7.7046C43.4851 7.7046 43.1398 7.85298 42.845 8.14972V10.2645C43.1398 10.5603 43.4851 10.7087 43.8295 10.7087C44.5388 10.7087 45.0311 10.0964 45.0311 9.20712C45.0311 8.31782 44.5388 7.7046 43.8295 7.7046ZM36.4814 11.3313C36.0977 11.6384 35.6644 11.7962 35.2311 11.7962C33.9209 11.7962 33.0057 10.7284 33.0057 9.20712C33.0057 7.68488 33.9209 6.61809 35.2311 6.61809C35.6644 6.61809 36.0977 6.77585 36.4814 7.0726V4.57184H37.7522V11.6778H36.4814V11.3313ZM36.4814 8.14972C36.1959 7.85298 35.8516 7.7046 35.5072 7.7046C34.7875 7.7046 34.2953 8.31782 34.2953 9.20712C34.2953 10.0964 34.7875 10.7087 35.5072 10.7087C35.8516 10.7087 36.1959 10.5603 36.4814 10.2645V8.14972ZM28.977 9.55271C29.0556 10.304 29.647 10.8176 30.4734 10.8176C30.9272 10.8176 31.4288 10.6495 31.9407 10.3528V11.4111C31.3802 11.6675 30.8187 11.7962 30.2665 11.7962C28.7795 11.7962 27.7361 10.7087 27.7361 9.16768C27.7361 7.67549 28.7599 6.61809 30.1683 6.61809C31.4588 6.61809 32.3347 7.63605 32.3347 9.08786C32.3347 9.22685 32.3347 9.38461 32.3151 9.55271H28.977ZM30.1196 7.59567C29.5085 7.59567 29.0359 8.05112 28.977 8.73289H31.1238C31.0844 8.06051 30.6811 7.59567 30.1196 7.59567ZM25.6576 8.37698V11.6778H24.397V6.73641H25.6576V7.23037C26.0123 6.83502 26.4456 6.61809 26.8685 6.61809C27.007 6.61809 27.1446 6.62748 27.2822 6.66692V7.79381C27.1446 7.75437 26.9874 7.73465 26.8395 7.73465C26.4259 7.73465 25.9823 7.96191 25.6576 8.37698ZM20.0342 9.55271C20.1128 10.304 20.7033 10.8176 21.5306 10.8176C21.9835 10.8176 22.4861 10.6495 22.998 10.3528V11.4111C22.4365 11.6675 21.875 11.7962 21.3238 11.7962C19.8367 11.7962 18.7933 10.7087 18.7933 9.16768C18.7933 7.67549 19.8171 6.61809 21.2255 6.61809C22.5151 6.61809 23.3919 7.63605 23.3919 9.08786C23.3919 9.22685 23.3919 9.38461 23.3723 9.55271H20.0342ZM21.1759 7.59567C20.5657 7.59567 20.0932 8.05112 20.0342 8.73289H22.181C22.1417 8.06051 21.7374 7.59567 21.1759 7.59567ZM15.6311 11.6778L14.626 8.31782L13.6313 11.6778H12.4989L10.8051 6.73641H12.0656L13.0604 10.0964L14.0552 6.73641H15.1969L16.1917 10.0964L17.1865 6.73641H18.447L16.7635 11.6778H15.6311ZM7.92833 11.7962C6.4413 11.7962 5.38756 10.719 5.38756 9.20712C5.38756 7.68488 6.4413 6.61809 7.92833 6.61809C9.41536 6.61809 10.4597 7.68488 10.4597 9.20712C10.4597 10.719 9.41536 11.7962 7.92833 11.7962ZM7.92833 7.67549C7.18996 7.67549 6.67807 8.2981 6.67807 9.20712C6.67807 10.1162 7.18996 10.7388 7.92833 10.7388C8.65734 10.7388 9.16924 10.1162 9.16924 9.20712C9.16924 8.2981 8.65734 7.67549 7.92833 7.67549ZM2.39291 9.23624H1.26056V11.6778H0V4.87798H2.39291C3.77232 4.87798 4.75681 5.77762 4.75681 7.06227C4.75681 8.34693 3.77232 9.23624 2.39291 9.23624ZM2.21604 5.90627H1.26056V8.20889H2.21604C2.94505 8.20889 3.45695 7.74404 3.45695 7.06227C3.45695 6.37111 2.94505 5.90627 2.21604 5.90627ZM95.9644 9.72268H90.7622C90.881 10.9726 91.7934 11.3407 92.8294 11.3407C93.8841 11.3407 94.7151 11.1172 95.4394 10.751V12.8986C94.7179 13.3006 93.7643 13.5898 92.4944 13.5898C89.9059 13.5898 88.0923 11.9633 88.0923 8.74792C88.0923 6.0321 89.6308 3.87598 92.1584 3.87598C94.6824 3.87598 96 6.03117 96 8.762C96 9.02025 95.9766 9.579 95.9644 9.72268ZM92.1416 6.04995C91.4771 6.04995 90.7388 6.55329 90.7388 7.75437H93.4864C93.4864 6.55423 92.7939 6.04995 92.1416 6.04995ZM83.7912 13.5898C82.861 13.5898 82.2929 13.1963 81.9111 12.9155L81.9055 15.9328L79.2487 16.5L79.2477 4.05347H81.5873L81.7258 4.71176C82.0927 4.36806 82.7655 3.87598 83.8071 3.87598C85.6731 3.87598 87.4306 5.56257 87.4306 8.66716C87.4306 12.0553 85.6919 13.5898 83.7912 13.5898ZM83.1717 6.23776C82.5624 6.23776 82.1797 6.46126 81.9027 6.76646L81.9186 10.7284C82.1769 11.0092 82.5484 11.2346 83.1717 11.2346C84.1543 11.2346 84.8131 10.1612 84.8131 8.72538C84.8131 7.33085 84.144 6.23776 83.1717 6.23776ZM75.4071 4.05347H78.0742V13.3992H75.4071V4.05347ZM75.4071 1.06908L78.0742 0.5V2.67209L75.4071 3.24117V1.06908ZM72.5631 7.06321V13.3992H69.9073V4.05347H72.2047L72.3713 4.84135C72.9936 3.6938 74.2355 3.92669 74.5892 4.05441V6.5054C74.2514 6.39553 73.1911 6.23588 72.5631 7.06321ZM66.8677 10.1208C66.8677 11.6919 68.5447 11.2027 68.8844 11.0665V13.2367C68.5307 13.432 67.8887 13.5898 67.0202 13.5898C65.4434 13.5898 64.2595 12.4244 64.2595 10.8458L64.2717 2.29176L66.8658 1.7377L66.8677 4.05347H68.8853V6.32698H66.8677V10.1208ZM63.5558 10.5754C63.5558 12.4948 62.0332 13.5898 59.8237 13.5898C58.9075 13.5898 57.9062 13.4114 56.918 12.985V10.4392C57.8098 10.9256 58.9459 11.2909 59.8265 11.2909C60.4189 11.2909 60.8456 11.1313 60.8456 10.6383C60.8456 9.36583 56.8066 9.84476 56.8066 6.89324C56.8066 5.00569 58.2431 3.87598 60.3983 3.87598C61.2789 3.87598 62.1586 4.01121 63.0392 4.36336V6.8754C62.2307 6.43685 61.2041 6.18893 60.3964 6.18893C59.8396 6.18893 59.4934 6.35045 59.4934 6.76646C59.4934 7.9666 63.5558 7.39565 63.5558 10.5754Z"
                                            fill="#A3A3A3"
                                        />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Address Modal */}
            <Dialog open={isAddressModalOpen} onOpenChange={setIsAddressModalOpen}>
                <DialogContent className="max-w-2xl border-neutral-700 bg-neutral-800 text-white">
                    <DialogHeader>
                        <DialogTitle>Complete Address Details</DialogTitle>
                        <DialogDescription className="text-neutral-400">Please provide the complete address information.</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-neutral-300">Street Address</label>
                            <Input
                                value={data.billing_address.street}
                                onChange={(e) => updateAddressField('street', e.target.value)}
                                placeholder="123 Main Street"
                                className="border-input ring-offset-background flex h-11 w-full rounded-lg border bg-white/5 px-3.5 py-2 text-sm text-white placeholder:text-white/40 hover:border-white/10 focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:outline-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-neutral-300">
                                Street Address Line 2 <span className="text-neutral-500">(Optional)</span>
                            </label>
                            <Input
                                value={data.billing_address.street_line_2}
                                onChange={(e) => updateAddressField('street_line_2', e.target.value)}
                                placeholder="Apartment, suite, unit, building, floor, etc."
                                className="border-input ring-offset-background flex h-11 w-full rounded-lg border bg-white/5 px-3.5 py-2 text-sm text-white placeholder:text-white/40 hover:border-white/10 focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:outline-none"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-neutral-300">City</label>
                                <Input
                                    value={data.billing_address.city}
                                    onChange={(e) => updateAddressField('city', e.target.value)}
                                    placeholder="New York"
                                    className="border-input ring-offset-background flex h-11 w-full rounded-lg border bg-white/5 px-3.5 py-2 text-sm text-white placeholder:text-white/40 hover:border-white/10 focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:outline-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-neutral-300">
                                    State/Province <span className="text-neutral-500">(Optional)</span>
                                </label>
                                <Input
                                    value={data.billing_address.state}
                                    onChange={(e) => updateAddressField('state', e.target.value)}
                                    placeholder="NY"
                                    className="border-input ring-offset-background flex h-11 w-full rounded-lg border bg-white/5 px-3.5 py-2 text-sm text-white placeholder:text-white/40 hover:border-white/10 focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:outline-none"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-neutral-300">Postal Code</label>
                                <Input
                                    value={data.billing_address.postal_code}
                                    onChange={(e) => updateAddressField('postal_code', e.target.value)}
                                    placeholder="10001"
                                    className="border-input ring-offset-background flex h-11 w-full rounded-lg border bg-white/5 px-3.5 py-2 text-sm text-white placeholder:text-white/40 hover:border-white/10 focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:outline-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-neutral-300">Country</label>
                                <Select value={data.billing_address.country} onValueChange={(value) => updateAddressField('country', value)}>
                                    <SelectTrigger className="border-input ring-offset-background flex h-11 w-full items-center justify-between rounded-lg border bg-white/5 px-3 py-2 text-sm text-white hover:border-white/10 focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:outline-none">
                                        <SelectValue placeholder="Select country" />
                                    </SelectTrigger>
                                    <SelectContent className="border-neutral-700 bg-neutral-800">
                                        {countries.map((country) => (
                                            <SelectItem key={country.code} value={country.code} className="text-white hover:bg-white/5">
                                                {country.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsAddressModalOpen(false)}
                            className="ring-offset-background border-input text-secondary-foreground border bg-white/5 hover:bg-neutral-700"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={saveAddress}
                            className="bg-blue-600 text-white hover:bg-blue-700"
                            disabled={
                                !data.billing_address.street ||
                                !data.billing_address.city ||
                                !data.billing_address.postal_code ||
                                !data.billing_address.country
                            }
                        >
                            Save Address
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
