import React, { useState } from 'react'
import { X, Copy, Facebook, Twitter, Linkedin, Mail, MessageCircle, Send, Check } from 'lucide-react'
import toast from 'react-hot-toast'

interface ShareModalProps {
    isOpen: boolean
    onClose: () => void
    title: string
    description?: string
    urls: {
        vote?: string
        nomination?: string
        results?: string
    }
    voteTitle: string
}

const ShareModal: React.FC<ShareModalProps> = ({
    isOpen,
    onClose,
    title,
    description,
    urls,
    voteTitle
}) => {
    const [copiedUrl, setCopiedUrl] = useState<string | null>(null)

    if (!isOpen) return null

    const handleCopyToClipboard = (url: string, type: string) => {
        navigator.clipboard.writeText(url).then(() => {
            setCopiedUrl(type)
            toast.success(`${type} link copied to clipboard!`)
            setTimeout(() => setCopiedUrl(null), 2000)
        }).catch(() => {
            toast.error('Failed to copy link')
        })
    }

    const handleSocialShare = (platform: string, url: string) => {
        const text = `Check out this voting event: ${voteTitle}`
        let shareUrl = ''

        switch (platform) {
            case 'facebook':
                shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
                break
            case 'twitter':
                shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`
                break
            case 'linkedin':
                shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
                break
            case 'whatsapp':
                shareUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`
                break
            case 'telegram':
                shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`
                break
            case 'email':
                shareUrl = `mailto:?subject=${encodeURIComponent(voteTitle)}&body=${encodeURIComponent(text + '\n\n' + url)}`
                break
        }

        if (shareUrl) {
            window.open(shareUrl, '_blank', 'width=600,height=400')
        }
    }

    return (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="card-glass max-w-md w-full max-h-[90vh] overflow-hidden animate-scale-in">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-secondary-700">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        Share {title}
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-secondary-800 transition-all duration-200 active:scale-95"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {description && (
                        <p className="text-gray-600 mb-6">{description}</p>
                    )}

                    {/* Share Links */}
                    <div className="space-y-4">
                        {urls.vote && (
                            <div className="border border-gray-200 rounded-lg p-4">
                                <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                                    <Send className="w-4 h-4 mr-2" />
                                    Vote Link
                                </h4>
                                <div className="flex items-center space-x-2 mb-3">
                                    <input
                                        type="text"
                                        value={urls.vote}
                                        readOnly
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 dark:bg-secondary-800"
                                    />
                                    <button
                                        onClick={() => handleCopyToClipboard(urls.vote!, 'Vote')}
                                        className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-1"
                                    >
                                        {copiedUrl === 'Vote' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                        <span className="text-sm">{copiedUrl === 'Vote' ? 'Copied' : 'Copy'}</span>
                                    </button>
                                </div>

                                {/* Social Share Buttons for Vote */}
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={() => handleSocialShare('facebook', urls.vote!)}
                                        className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                                    >
                                        <Facebook className="w-4 h-4" />
                                        <span>Facebook</span>
                                    </button>
                                    <button
                                        onClick={() => handleSocialShare('twitter', urls.vote!)}
                                        className="flex items-center space-x-1 px-3 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors text-sm"
                                    >
                                        <Twitter className="w-4 h-4" />
                                        <span>Twitter</span>
                                    </button>
                                    <button
                                        onClick={() => handleSocialShare('whatsapp', urls.vote!)}
                                        className="flex items-center space-x-1 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
                                    >
                                        <MessageCircle className="w-4 h-4" />
                                        <span>WhatsApp</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        {urls.nomination && (
                            <div className="border border-gray-200 rounded-lg p-4">
                                <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                                    <Send className="w-4 h-4 mr-2" />
                                    Nomination Link
                                </h4>
                                <div className="flex items-center space-x-2 mb-3">
                                    <input
                                        type="text"
                                        value={urls.nomination}
                                        readOnly
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 dark:bg-secondary-800"
                                    />
                                    <button
                                        onClick={() => handleCopyToClipboard(urls.nomination!, 'Nomination')}
                                        className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-1"
                                    >
                                        {copiedUrl === 'Nomination' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                        <span className="text-sm">{copiedUrl === 'Nomination' ? 'Copied' : 'Copy'}</span>
                                    </button>
                                </div>

                                {/* Social Share Buttons for Nomination */}
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={() => handleSocialShare('linkedin', urls.nomination!)}
                                        className="flex items-center space-x-1 px-3 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors text-sm"
                                    >
                                        <Linkedin className="w-4 h-4" />
                                        <span>LinkedIn</span>
                                    </button>
                                    <button
                                        onClick={() => handleSocialShare('telegram', urls.nomination!)}
                                        className="flex items-center space-x-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                                    >
                                        <Send className="w-4 h-4" />
                                        <span>Telegram</span>
                                    </button>
                                    <button
                                        onClick={() => handleSocialShare('email', urls.nomination!)}
                                        className="flex items-center space-x-1 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                                    >
                                        <Mail className="w-4 h-4" />
                                        <span>Email</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        {urls.results && (
                            <div className="border border-gray-200 rounded-lg p-4">
                                <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                                    <Send className="w-4 h-4 mr-2" />
                                    Results Link
                                </h4>
                                <div className="flex items-center space-x-2 mb-3">
                                    <input
                                        type="text"
                                        value={urls.results}
                                        readOnly
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 dark:bg-secondary-800"
                                    />
                                    <button
                                        onClick={() => handleCopyToClipboard(urls.results!, 'Results')}
                                        className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-1"
                                    >
                                        {copiedUrl === 'Results' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                        <span className="text-sm">{copiedUrl === 'Results' ? 'Copied' : 'Copy'}</span>
                                    </button>
                                </div>

                                {/* Social Share Buttons for Results */}
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={() => handleSocialShare('facebook', urls.results!)}
                                        className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                                    >
                                        <Facebook className="w-4 h-4" />
                                        <span>Facebook</span>
                                    </button>
                                    <button
                                        onClick={() => handleSocialShare('twitter', urls.results!)}
                                        className="flex items-center space-x-1 px-3 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors text-sm"
                                    >
                                        <Twitter className="w-4 h-4" />
                                        <span>Twitter</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 dark:bg-secondary-800 rounded-b-2xl">
                    <button
                        onClick={onClose}
                        className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ShareModal 