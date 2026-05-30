import React, { useState } from 'react'
import { BarChart3, TrendingUp, TrendingDown, Calendar, Download } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'

interface ChartData {
    labels: string[]
    votes: number[]
    revenue: number[]
}

interface AnalyticsChartProps {
    title: string
    period?: 'daily' | 'weekly' | 'monthly' | 'yearly'
    showDownload?: boolean
    apiEndpoint?: () => Promise<{ data: ChartData }>
}

// Mock chart data - replace with actual API call
const mockChartData: ChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    votes: [65, 78, 90, 81, 89, 95],
    revenue: [2800, 3200, 4100, 3800, 4500, 5200]
}

const AnalyticsChart: React.FC<AnalyticsChartProps> = ({
    title,
    period = 'monthly',
    showDownload = true,
    apiEndpoint
}) => {
    const [selectedPeriod, setSelectedPeriod] = useState(period)
    const [viewType, setViewType] = useState<'votes' | 'revenue'>('revenue')

    const { data: chartData, isLoading } = useQuery({
        queryKey: ['analytics-chart', selectedPeriod],
        queryFn: apiEndpoint || (() => Promise.resolve({ data: mockChartData })),
        refetchInterval: 300000 // Refetch every 5 minutes
    })

    const data = chartData?.data || mockChartData

    // Calculate percentage change
    const calculateChange = (values: number[]) => {
        if (values.length < 2) return 0
        const current = values[values.length - 1]
        const previous = values[values.length - 2]
        return ((current - previous) / previous) * 100
    }

    const voteChange = calculateChange(data.votes)
    const revenueChange = calculateChange(data.revenue)

    // Get max value for scaling bars
    const maxValue = Math.max(...(viewType === 'votes' ? data.votes : data.revenue))

    const handleDownload = () => {
        const csvContent = [
            ['Period', 'Votes', 'Revenue'],
            ...data.labels.map((label, index) => [
                label,
                data.votes[index],
                data.revenue[index]
            ])
        ].map(row => row.join(',')).join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `analytics-${selectedPeriod}-${Date.now()}.csv`
        a.click()
        window.URL.revokeObjectURL(url)
    }

    return (
        <div className="card-glass p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                        Performance overview for the selected period
                    </p>
                </div>
                <div className="flex items-center space-x-3">
                    {/* Period Selector */}
                    <select
                        value={selectedPeriod}
                        onChange={(e) => setSelectedPeriod(e.target.value as any)}
                        className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                    </select>

                    {/* Download Button */}
                    {showDownload && (
                        <button
                            onClick={handleDownload}
                            className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-secondary-800 transition-colors"
                        >
                            <Download className="w-4 h-4" />
                            <span>Export</span>
                        </button>
                    )}
                </div>
            </div>

            {/* View Type Toggle */}
            <div className="flex items-center space-x-1 mb-6 bg-gray-100 rounded-lg p-1">
                <button
                    onClick={() => setViewType('revenue')}
                    className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${viewType === 'revenue'
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-800'
                        }`}
                >
                    Revenue
                </button>
                <button
                    onClick={() => setViewType('votes')}
                    className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${viewType === 'votes'
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-800'
                        }`}
                >
                    Votes
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                ₦{data.revenue.reduce((a, b) => a + b, 0).toLocaleString()}
                            </p>
                        </div>
                        <div className={`flex items-center space-x-1 ${revenueChange >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                            {revenueChange >= 0 ? (
                                <TrendingUp className="w-4 h-4" />
                            ) : (
                                <TrendingDown className="w-4 h-4" />
                            )}
                            <span className="text-sm font-medium">
                                {Math.abs(revenueChange).toFixed(1)}%
                            </span>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Total Votes</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {data.votes.reduce((a, b) => a + b, 0).toLocaleString()}
                            </p>
                        </div>
                        <div className={`flex items-center space-x-1 ${voteChange >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                            {voteChange >= 0 ? (
                                <TrendingUp className="w-4 h-4" />
                            ) : (
                                <TrendingDown className="w-4 h-4" />
                            )}
                            <span className="text-sm font-medium">
                                {Math.abs(voteChange).toFixed(1)}%
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Chart */}
            {isLoading ? (
                <div className="h-64 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            ) : (
                <div className="h-64">
                    <div className="flex items-end justify-between h-full space-x-2 pb-4">
                        {data.labels.map((label, index) => {
                            const values = viewType === 'votes' ? data.votes : data.revenue
                            const value = values[index]
                            const height = (value / maxValue) * 100

                            return (
                                <div key={label} className="flex-1 flex flex-col items-center">
                                    <div className="w-full flex flex-col items-center justify-end h-full">
                                        <div className="relative group">
                                            <div
                                                className={`w-full rounded-t-md transition-all duration-300 hover:opacity-80 ${viewType === 'revenue'
                                                        ? 'bg-gradient-to-t from-blue-600 to-blue-400'
                                                        : 'bg-gradient-to-t from-green-600 to-green-400'
                                                    }`}
                                                style={{ height: `${height}%`, minHeight: '8px' }}
                                            />
                                            {/* Tooltip */}
                                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-10">
                                                {viewType === 'revenue' ? `₦${value.toLocaleString()}` : value.toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-600 mt-2 font-medium">{label}</p>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Chart Legend */}
            <div className="flex items-center justify-center mt-4 space-x-6 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-gradient-to-r from-blue-600 to-blue-400 rounded"></div>
                    <span>Revenue</span>
                </div>
                <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-gradient-to-r from-green-600 to-green-400 rounded"></div>
                    <span>Votes</span>
                </div>
            </div>
        </div>
    )
}

export default AnalyticsChart 