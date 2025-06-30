import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Cpu, HardDrive, Info, MemoryStick, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface MetricDataPoint {
    timestamp: string;
    value: number;
    formatted_time: string;
}

interface PeriodInfo {
    start_date: string;
    end_date: string;
    duration_hours: number;
    data_points: {
        cpu: number;
        ram: number;
        disk: number;
    };
}

interface ChartsProps {
    organization: { id: string };
    server: { id: string; name: string };
}

export default function MetricsCharts({ organization, server }: ChartsProps) {
    const [timeRange, setTimeRange] = useState<'1h' | '12h' | '24h' | '7' | '15' | '30'>('24h');
    const [cpuData, setCpuData] = useState<MetricDataPoint[]>([]);
    const [ramData, setRamData] = useState<MetricDataPoint[]>([]);
    const [diskData, setDiskData] = useState<MetricDataPoint[]>([]);
    const [periodInfo, setPeriodInfo] = useState<PeriodInfo | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchMetricsData = async () => {
        setLoading(true);
        setError(null);

        try {
            // Construire les paramètres selon la période
            let params = '';

            if (['1h', '12h', '24h'].includes(timeRange)) {
                // Pour les périodes courtes, utiliser le nouveau format
                params = `period=${timeRange}`;
            } else {
                // Pour les périodes longues, utiliser le format jours
                params = `period=${timeRange}d`;
            }

            const endpoint = `/organizations/${organization.id}/servers/${server.id}/metrics?${params}`;
            console.log('🔍 Fetching metrics:', { endpoint, timeRange, params });

            const response = await fetch(endpoint, {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (response.ok) {
                const data = await response.json();
                console.log('📊 Received data:', {
                    cpu_points: data.cpu?.length || 0,
                    ram_points: data.ram?.length || 0,
                    disk_points: data.disk?.length || 0,
                    period_info: data.period_info,
                    first_cpu_point: data.cpu?.[0],
                    last_cpu_point: data.cpu?.[data.cpu?.length - 1],
                });

                setCpuData(data.cpu || []);
                setRamData(data.ram || []);
                setDiskData(data.disk || []);
                setPeriodInfo(data.period_info || null);
            } else {
                const errorData = await response.text();
                console.error('❌ API Error:', response.status, response.statusText, errorData);
                throw new Error(`Erreur API: ${response.status} ${response.statusText}`);
            }
        } catch (error) {
            console.error('💥 Fetch error:', error);
            if (error instanceof Error) {
                setError(error.message);
            } else {
                setError('Erreur lors du chargement des métriques');
            }
            // Vider les données en cas d'erreur
            setCpuData([]);
            setRamData([]);
            setDiskData([]);
            setPeriodInfo(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMetricsData();
    }, [timeRange]);

    const formatTooltipValue = (value: number, name: string) => {
        return [`${value.toFixed(1)}%`, name];
    };

    const formatXAxisLabel = (tickItem: string) => {
        const date = new Date(tickItem);

        // Format selon la période sélectionnée
        if (timeRange === '1h') {
            return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        } else if (timeRange === '12h' || timeRange === '24h') {
            return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        } else if (timeRange === '7') {
            return date.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric', hour: '2-digit' });
        } else {
            return date.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' });
        }
    };

    const getTimeRangeLabel = () => {
        const labels = {
            '1h': '1 heure',
            '12h': '12 heures',
            '24h': '24 heures',
            '7': '7 jours',
            '15': '15 jours',
            '30': '30 jours',
        };
        return labels[timeRange];
    };

    // Composant d'information sur la période
    const PeriodInfoDisplay = () => {
        if (!periodInfo) return null;

        // Formater la durée de manière lisible
        const formatDuration = (hours: number) => {
            if (hours < 1) {
                const minutes = Math.round(hours * 60);
                return `${minutes} min`;
            } else if (hours < 24) {
                return `${Math.round(hours)}h`;
            } else {
                const days = Math.round(hours / 24);
                return `${days} jour${days > 1 ? 's' : ''}`;
            }
        };

        return (
            <Card className="bg-card border-border mb-4">
                <CardHeader className="pb-3">
                    <CardTitle className="text-card-foreground flex items-center gap-2 text-sm">
                        <Info className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                        Informations de la période
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                    <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                        <div>
                            <p className="text-muted-foreground">Durée</p>
                            <p className="text-card-foreground font-medium">{formatDuration(periodInfo.duration_hours)}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground">Points CPU</p>
                            <p className="text-card-foreground font-medium">{periodInfo.data_points.cpu}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground">Points RAM</p>
                            <p className="text-card-foreground font-medium">{periodInfo.data_points.ram}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground">Points Disque</p>
                            <p className="text-card-foreground font-medium">{periodInfo.data_points.disk}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    };

    // Composant d'erreur
    const ErrorDisplay = ({ message }: { message: string }) => (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 dark:border-amber-800 dark:bg-amber-900/20">
            <div className="flex items-start space-x-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
                <div>
                    <h3 className="mb-1 text-sm font-medium text-amber-900 dark:text-amber-100">Erreur de chargement</h3>
                    <p className="text-sm text-amber-800 dark:text-amber-200">{message}</p>
                    <Button
                        variant="outline"
                        size="sm"
                        className="mt-3 border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900/50"
                        onClick={fetchMetricsData}
                    >
                        Réessayer
                    </Button>
                </div>
            </div>
        </div>
    );

    // Composant de graphique vide
    const EmptyChart = ({ title, icon: Icon, description }: { title: string; icon: any; description: string }) => (
        <Card className="bg-card border-border">
            <CardHeader>
                <CardTitle className="text-card-foreground flex items-center gap-2">
                    <Icon className="text-muted-foreground h-5 w-5" />
                    {title}
                </CardTitle>
                <CardDescription className="text-muted-foreground">{description}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex h-64 items-center justify-center">
                    <div className="text-center">
                        <AlertTriangle className="text-muted-foreground mx-auto mb-2 h-8 w-8" />
                        <p className="text-muted-foreground text-sm">Aucune donnée disponible</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );

    return (
        <div className="space-y-6">
            {/* Controls */}
            <div className="flex items-center justify-between">
                <h3 className="text-card-foreground text-lg font-medium">Graphiques de performance</h3>
                <div className="flex items-center gap-2">
                    <Select value={timeRange} onValueChange={(value: '1h' | '12h' | '24h' | '7' | '15' | '30') => setTimeRange(value)}>
                        <SelectTrigger className="w-40">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="1h">1 heure</SelectItem>
                            <SelectItem value="12h">12 heures</SelectItem>
                            <SelectItem value="24h">24 heures</SelectItem>
                            <SelectItem value="7">7 jours</SelectItem>
                            <SelectItem value="15">15 jours</SelectItem>
                            <SelectItem value="30">30 jours</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" onClick={fetchMetricsData} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </div>

            {/* Informations de période */}
            <PeriodInfoDisplay />

            {/* Affichage d'erreur global */}
            {error && <ErrorDisplay message={error} />}

            {/* CPU Chart */}
            {!error &&
                (cpuData.length > 0 ? (
                    <Card className="bg-card border-border">
                        <CardHeader>
                            <CardTitle className="text-card-foreground flex items-center gap-2">
                                <Cpu className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                                Utilisation CPU
                            </CardTitle>
                            <CardDescription className="text-muted-foreground">
                                Utilisation du processeur sur {getTimeRangeLabel()} ({cpuData.length} points)
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={cpuData}>
                                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                                        <XAxis dataKey="timestamp" tickFormatter={formatXAxisLabel} className="text-muted-foreground" fontSize={12} />
                                        <YAxis
                                            domain={[0, 100]}
                                            className="text-muted-foreground"
                                            fontSize={12}
                                            label={{ value: '%', angle: -90, position: 'insideLeft' }}
                                        />
                                        <Tooltip
                                            formatter={formatTooltipValue}
                                            labelFormatter={(label: string) => new Date(label).toLocaleString('fr-FR')}
                                            contentStyle={{
                                                backgroundColor: 'hsl(var(--card))',
                                                border: '1px solid hsl(var(--border))',
                                                borderRadius: '6px',
                                                color: 'hsl(var(--card-foreground))',
                                            }}
                                        />
                                        <ReferenceLine y={80} stroke="#ef4444" strokeDasharray="5 5" />
                                        <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={false} name="CPU" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <EmptyChart title="Utilisation CPU" icon={Cpu} description={`Utilisation du processeur sur ${getTimeRangeLabel()}`} />
                ))}

            {/* RAM Chart */}
            {!error &&
                (ramData.length > 0 ? (
                    <Card className="bg-card border-border">
                        <CardHeader>
                            <CardTitle className="text-card-foreground flex items-center gap-2">
                                <MemoryStick className="h-5 w-5 text-green-500 dark:text-green-400" />
                                Utilisation mémoire
                            </CardTitle>
                            <CardDescription className="text-muted-foreground">
                                Utilisation de la RAM sur {getTimeRangeLabel()} ({ramData.length} points)
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={ramData}>
                                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                                        <XAxis dataKey="timestamp" tickFormatter={formatXAxisLabel} className="text-muted-foreground" fontSize={12} />
                                        <YAxis
                                            domain={[0, 100]}
                                            className="text-muted-foreground"
                                            fontSize={12}
                                            label={{ value: '%', angle: -90, position: 'insideLeft' }}
                                        />
                                        <Tooltip
                                            formatter={formatTooltipValue}
                                            labelFormatter={(label: string) => new Date(label).toLocaleString('fr-FR')}
                                            contentStyle={{
                                                backgroundColor: 'hsl(var(--card))',
                                                border: '1px solid hsl(var(--border))',
                                                borderRadius: '6px',
                                                color: 'hsl(var(--card-foreground))',
                                            }}
                                        />
                                        <ReferenceLine y={85} stroke="#ef4444" strokeDasharray="5 5" />
                                        <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} dot={false} name="RAM" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <EmptyChart title="Utilisation mémoire" icon={MemoryStick} description={`Utilisation de la RAM sur ${getTimeRangeLabel()}`} />
                ))}

            {/* Disk Chart */}
            {!error &&
                (diskData.length > 0 ? (
                    <Card className="bg-card border-border">
                        <CardHeader>
                            <CardTitle className="text-card-foreground flex items-center gap-2">
                                <HardDrive className="h-5 w-5 text-purple-500 dark:text-purple-400" />
                                Utilisation disque
                            </CardTitle>
                            <CardDescription className="text-muted-foreground">
                                Utilisation du stockage sur {getTimeRangeLabel()} ({diskData.length} points)
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={diskData}>
                                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                                        <XAxis dataKey="timestamp" tickFormatter={formatXAxisLabel} className="text-muted-foreground" fontSize={12} />
                                        <YAxis
                                            domain={[0, 100]}
                                            className="text-muted-foreground"
                                            fontSize={12}
                                            label={{ value: '%', angle: -90, position: 'insideLeft' }}
                                        />
                                        <Tooltip
                                            formatter={formatTooltipValue}
                                            labelFormatter={(label: string) => new Date(label).toLocaleString('fr-FR')}
                                            contentStyle={{
                                                backgroundColor: 'hsl(var(--card))',
                                                border: '1px solid hsl(var(--border))',
                                                borderRadius: '6px',
                                                color: 'hsl(var(--card-foreground))',
                                            }}
                                        />
                                        <ReferenceLine y={90} stroke="#ef4444" strokeDasharray="5 5" />
                                        <Line type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Disk" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <EmptyChart title="Utilisation disque" icon={HardDrive} description={`Utilisation du stockage sur ${getTimeRangeLabel()}`} />
                ))}
        </div>
    );
}
