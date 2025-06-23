import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Cpu, HardDrive, MemoryStick, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface MetricDataPoint {
    timestamp: string;
    value: number;
    formatted_time: string;
}

interface ChartsProps {
    project: { id: string };
    server: { id: string; name: string };
}

export default function MetricsCharts({ project, server }: ChartsProps) {
    const [timeRange, setTimeRange] = useState<'1h' | '12h' | '24h' | '7' | '15' | '30'>('24h');
    const [cpuData, setCpuData] = useState<MetricDataPoint[]>([]);
    const [ramData, setRamData] = useState<MetricDataPoint[]>([]);
    const [diskData, setDiskData] = useState<MetricDataPoint[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchMetricsData = async () => {
        setLoading(true);
        try {
            // Construire les paramètres selon la période
            let params = '';
            if (['1h', '12h', '24h'].includes(timeRange)) {
                params = `hours=${timeRange.replace('h', '')}`;
            } else {
                params = `days=${timeRange}`;
            }

            const response = await fetch(`/projects/${project.id}/servers/${server.id}/metrics?${params}`, {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (response.ok) {
                const data = await response.json();
                setCpuData(data.cpu || []);
                setRamData(data.ram || []);
                setDiskData(data.disk || []);
            } else {
                console.error('Error fetching metrics:', response.status, response.statusText);
            }
        } catch (error) {
            console.error('Error fetching metrics:', error);
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

            {/* CPU Chart */}
            <Card className="bg-card border-border">
                <CardHeader>
                    <CardTitle className="text-card-foreground flex items-center gap-2">
                        <Cpu className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                        Utilisation CPU
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">Utilisation du processeur sur {getTimeRangeLabel()}</CardDescription>
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

            {/* RAM Chart */}
            <Card className="bg-card border-border">
                <CardHeader>
                    <CardTitle className="text-card-foreground flex items-center gap-2">
                        <MemoryStick className="h-5 w-5 text-green-500 dark:text-green-400" />
                        Utilisation mémoire
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">Utilisation de la RAM sur {getTimeRangeLabel()}</CardDescription>
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

            {/* Disk Chart */}
            <Card className="bg-card border-border">
                <CardHeader>
                    <CardTitle className="text-card-foreground flex items-center gap-2">
                        <HardDrive className="h-5 w-5 text-purple-500 dark:text-purple-400" />
                        Utilisation disque
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">Utilisation du stockage sur {getTimeRangeLabel()}</CardDescription>
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
        </div>
    );
}
