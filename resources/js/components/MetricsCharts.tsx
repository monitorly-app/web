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
    const [timeRange, setTimeRange] = useState<'7' | '15' | '30'>('7');
    const [cpuData, setCpuData] = useState<MetricDataPoint[]>([]);
    const [ramData, setRamData] = useState<MetricDataPoint[]>([]);
    const [diskData, setDiskData] = useState<MetricDataPoint[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchMetricsData = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/projects/${project.id}/servers/${server.id}/metrics?days=${timeRange}`, {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (response.ok) {
                const data = await response.json();
                setCpuData(data.cpu || []);
                setRamData(data.ram || []);
                setDiskData(data.disk || []);
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
        if (timeRange === '7') {
            return date.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric', hour: '2-digit' });
        } else {
            return date.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' });
        }
    };

    return (
        <div className="space-y-6">
            {/* Controls */}
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Performance Charts</h3>
                <div className="flex items-center gap-2">
                    <Select value={timeRange} onValueChange={(value: '7' | '15' | '30') => setTimeRange(value)}>
                        <SelectTrigger className="w-32">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="7">7 days</SelectItem>
                            <SelectItem value="15">15 days</SelectItem>
                            <SelectItem value="30">30 days</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" onClick={fetchMetricsData} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </div>

            {/* CPU Chart */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Cpu className="h-5 w-5 text-blue-500" />
                        CPU Usage
                    </CardTitle>
                    <CardDescription>CPU utilization over the last {timeRange} days</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={cpuData}>
                                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                                <XAxis dataKey="timestamp" tickFormatter={formatXAxisLabel} stroke="#6b7280" fontSize={12} />
                                <YAxis domain={[0, 100]} stroke="#6b7280" fontSize={12} label={{ value: '%', angle: -90, position: 'insideLeft' }} />
                                <Tooltip
                                    formatter={formatTooltipValue}
                                    labelFormatter={(label: string) => new Date(label).toLocaleString('fr-FR')}
                                    contentStyle={{
                                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '6px',
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
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MemoryStick className="h-5 w-5 text-green-500" />
                        Memory Usage
                    </CardTitle>
                    <CardDescription>RAM utilization over the last {timeRange} days</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={ramData}>
                                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                                <XAxis dataKey="timestamp" tickFormatter={formatXAxisLabel} stroke="#6b7280" fontSize={12} />
                                <YAxis domain={[0, 100]} stroke="#6b7280" fontSize={12} label={{ value: '%', angle: -90, position: 'insideLeft' }} />
                                <Tooltip
                                    formatter={formatTooltipValue}
                                    labelFormatter={(label: string) => new Date(label).toLocaleString('fr-FR')}
                                    contentStyle={{
                                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '6px',
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
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <HardDrive className="h-5 w-5 text-purple-500" />
                        Disk Usage
                    </CardTitle>
                    <CardDescription>Disk utilization over the last {timeRange} days</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={diskData}>
                                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                                <XAxis dataKey="timestamp" tickFormatter={formatXAxisLabel} stroke="#6b7280" fontSize={12} />
                                <YAxis domain={[0, 100]} stroke="#6b7280" fontSize={12} label={{ value: '%', angle: -90, position: 'insideLeft' }} />
                                <Tooltip
                                    formatter={formatTooltipValue}
                                    labelFormatter={(label: string) => new Date(label).toLocaleString('fr-FR')}
                                    contentStyle={{
                                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '6px',
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
