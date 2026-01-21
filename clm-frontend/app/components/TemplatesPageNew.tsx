'use client'

/**
 * Templates Management Page
 * Production-level implementation with all 5 template API endpoints integrated
 * 
 * Features:
 * - View all 7 template types (NDA, MSA, EMPLOYMENT, SERVICE_AGREEMENT, AGENCY_AGREEMENT, PROPERTY_MANAGEMENT, PURCHASE_AGREEMENT)
 * - View detailed template information with required/optional fields
 * - Validate template data before creation
 * - Create templates from predefined types
 * - Comprehensive error handling and loading states
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/lib/auth-context'
import {
  templateAPI,
  tokenManager,
  TemplateTypeInfo,
  TemplateField,
  TemplateCreateRequest,
  APIError,
} from '@/app/lib/api'

// Template type keys
const TEMPLATE_TYPES = [
  'NDA',
  'MSA',
  'EMPLOYMENT',
  'SERVICE_AGREEMENT',
  'AGENCY_AGREEMENT',
  'PROPERTY_MANAGEMENT',
  'PURCHASE_AGREEMENT',
] as const

type TemplateType = typeof TEMPLATE_TYPES[number]

export default function TemplatesPageNew() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useAuth()

  // State management
  const [templateTypes, setTemplateTypes] = useState<Record<string, TemplateTypeInfo>>({})
  const [selectedType, setSelectedType] = useState<TemplateType | null>(null)
  const [selectedTypeDetail, setSelectedTypeDetail] = useState<TemplateTypeInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  
  // Form data for template creation
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'draft' as 'draft' | 'published',
    data: {} as Record<string, any>,
  })
  
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [isValidating, setIsValidating] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  // Authentication check
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/')
    }
  }, [isAuthenticated, authLoading, router])

  // Load all template types on mount
  useEffect(() => {
    if (isAuthenticated) {
      loadTemplateTypes()
    }
  }, [isAuthenticated])

  /**
   * Load all available template types
   * GET /api/v1/templates/types/
   */
  const loadTemplateTypes = async () => {
    try {
      setIsLoading(true)
      setError('')
      const token = tokenManager.getAccessToken()
      if (!token) {
        router.push('/')
        return
      }

      const response = await templateAPI.getAllTemplateTypes(token)
      setTemplateTypes(response.template_types)
    } catch (err: any) {
      setError(err.message || 'Failed to load template types')
      console.error('Error loading template types:', err)
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Load detailed information for a specific template type
   * GET /api/v1/templates/types/{type}/
   */
  const loadTemplateDetail = async (templateType: TemplateType) => {
    try {
      setError('')
      const token = tokenManager.getAccessToken()
      if (!token) return

      const response = await templateAPI.getTemplateTypeDetail(token, templateType)
      setSelectedTypeDetail({
        display_name: response.display_name,
        description: response.description,
        contract_type: response.contract_type,
        required_fields: response.required_fields,
        optional_fields: response.optional_fields,
        mandatory_clauses: response.mandatory_clauses,
        business_rules: response.business_rules,
        sample_data: response.sample_data,
      })
      setSelectedType(templateType)
      setShowDetailModal(true)
    } catch (err: any) {
      setError(err.message || 'Failed to load template details')
      console.error('Error loading template detail:', err)
    }
  }

  /**
   * Initialize create form with a template type
   */
  const startTemplateCreation = (templateType: TemplateType) => {
    const typeInfo = templateTypes[templateType]
    if (!typeInfo) return

    // Initialize form data with empty values for required fields
    const initialData: Record<string, any> = {}
    typeInfo.required_fields.forEach((field) => {
      initialData[field.name] = field.sample_data?.[field.name] || ''
    })

    setSelectedType(templateType)
    setSelectedTypeDetail(typeInfo)
    setFormData({
      name: '',
      description: '',
      status: 'draft',
      data: initialData,
    })
    setValidationErrors([])
    setShowCreateModal(true)
  }

  /**
   * Validate template data before creation
   * POST /api/v1/templates/validate/
   */
  const validateTemplateData = async (): Promise<boolean> => {
    if (!selectedType) return false

    try {
      setIsValidating(true)
      setValidationErrors([])
      const token = tokenManager.getAccessToken()
      if (!token) return false

      const response = await templateAPI.validateTemplateData(token, {
        template_type: selectedType,
        data: formData.data,
      })

      if (!response.is_valid) {
        setValidationErrors(response.missing_fields)
        return false
      }

      return true
    } catch (err: any) {
      setError(err.message || 'Validation failed')
      return false
    } finally {
      setIsValidating(false)
    }
  }

  /**
   * Create template from type
   * POST /api/v1/templates/create-from-type/
   */
  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedType) {
      setError('No template type selected')
      return
    }

    if (!formData.name.trim()) {
      setError('Template name is required')
      return
    }

    // Validate before creating
    const isValid = await validateTemplateData()
    if (!isValid) {
      setError('Please fill all required fields')
      return
    }

    try {
      setIsCreating(true)
      setError('')
      const token = tokenManager.getAccessToken()
      if (!token) return

      const createRequest: TemplateCreateRequest = {
        template_type: selectedType,
        name: formData.name,
        description: formData.description,
        status: formData.status,
        data: formData.data,
      }

      const response = await templateAPI.createTemplateFromType(token, createRequest)

      setSuccessMessage(
        `Template "${response.name}" created successfully! Template ID: ${response.template_id}`
      )
      setShowCreateModal(false)
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        status: 'draft',
        data: {},
      })
      setValidationErrors([])
    } catch (err: any) {
      if (err instanceof APIError) {
        setError(err.message)
      } else {
        setError('Failed to create template. Please try again.')
      }
      console.error('Error creating template:', err)
    } finally {
      setIsCreating(false)
    }
  }

  /**
   * Update form data field value
   */
  const updateFormDataField = (fieldName: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      data: {
        ...prev.data,
        [fieldName]: value,
      },
    }))
  }

  // Loading state
  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading templates...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Contract Templates</h1>
              <p className="mt-2 text-sm text-gray-600">
                Create professional contracts from pre-built templates
              </p>
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-green-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">{successMessage}</p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={() => setSuccessMessage('')}
                  className="text-green-400 hover:text-green-600"
                >
                  <span className="sr-only">Dismiss</span>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={() => setError('')}
                  className="text-red-400 hover:text-red-600"
                >
                  <span className="sr-only">Dismiss</span>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Template Types Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TEMPLATE_TYPES.map((type) => {
            const typeInfo = templateTypes[type]
            if (!typeInfo) return null

            return (
              <div
                key={type}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-200 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {typeInfo.display_name}
                    </h3>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {type}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                    {typeInfo.description}
                  </p>
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <span>{typeInfo.required_fields.length} required fields</span>
                    <span>{typeInfo.optional_fields.length} optional fields</span>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => loadTemplateDetail(type)}
                      className="flex-1 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => startTemplateCreation(type)}
                      className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                    >
                      Create Template
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Template Detail Modal */}
      {showDetailModal && selectedTypeDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedTypeDetail.display_name}
                </h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <p className="mt-2 text-gray-600">{selectedTypeDetail.description}</p>
            </div>

            <div className="p-6 space-y-6">
              {/* Required Fields */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Required Fields ({selectedTypeDetail.required_fields.length})
                </h3>
                <div className="space-y-3">
                  {selectedTypeDetail.required_fields.map((field) => (
                    <div
                      key={field.name}
                      className="flex items-start space-x-3 p-3 bg-gray-50 rounded-md"
                    >
                      <div className="flex-shrink-0 mt-1">
                        <svg
                          className="h-5 w-5 text-red-500"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{field.name}</p>
                        <p className="text-sm text-gray-600">{field.description}</p>
                        <span className="inline-block mt-1 px-2 py-1 text-xs font-medium bg-gray-200 text-gray-700 rounded">
                          {field.type}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Optional Fields */}
              {selectedTypeDetail.optional_fields.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Optional Fields ({selectedTypeDetail.optional_fields.length})
                  </h3>
                  <div className="space-y-3">
                    {selectedTypeDetail.optional_fields.map((field) => (
                      <div
                        key={field.name}
                        className="flex items-start space-x-3 p-3 bg-gray-50 rounded-md"
                      >
                        <div className="flex-shrink-0 mt-1">
                          <svg
                            className="h-5 w-5 text-gray-400"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{field.name}</p>
                          <p className="text-sm text-gray-600">{field.description}</p>
                          <span className="inline-block mt-1 px-2 py-1 text-xs font-medium bg-gray-200 text-gray-700 rounded">
                            {field.type}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Mandatory Clauses */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Mandatory Clauses ({selectedTypeDetail.mandatory_clauses.length})
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {selectedTypeDetail.mandatory_clauses.map((clause) => (
                    <div
                      key={clause}
                      className="px-3 py-2 bg-blue-50 text-blue-700 rounded-md text-sm font-medium"
                    >
                      {clause}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-between">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowDetailModal(false)
                  if (selectedType) startTemplateCreation(selectedType)
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Create Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Template Modal */}
      {showCreateModal && selectedTypeDetail && selectedType && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                Create {selectedTypeDetail.display_name}
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Fill in the required information to create your template
              </p>
            </div>

            <form onSubmit={handleCreateTemplate} className="p-6 space-y-6">
              {/* Template Metadata */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Template Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Acme-Tech NDA"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Brief description of this template"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value as 'draft' | 'published' })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>
              </div>

              {/* Required Fields */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Required Fields</h3>
                <div className="space-y-4">
                  {selectedTypeDetail.required_fields.map((field) => (
                    <div key={field.name}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {field.name.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                        <span className="text-red-500">*</span>
                      </label>
                      <p className="text-xs text-gray-500 mb-1">{field.description}</p>
                      {field.type === 'date' ? (
                        <input
                          type="date"
                          value={formData.data[field.name] || ''}
                          onChange={(e) => updateFormDataField(field.name, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      ) : field.type === 'number' ? (
                        <input
                          type="number"
                          step="0.01"
                          value={formData.data[field.name] || ''}
                          onChange={(e) => updateFormDataField(field.name, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      ) : (
                        <input
                          type="text"
                          value={formData.data[field.name] || ''}
                          onChange={(e) => updateFormDataField(field.name, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Optional Fields */}
              {selectedTypeDetail.optional_fields.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Optional Fields
                  </h3>
                  <div className="space-y-4">
                    {selectedTypeDetail.optional_fields.map((field) => (
                      <div key={field.name}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {field.name.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                        </label>
                        <p className="text-xs text-gray-500 mb-1">{field.description}</p>
                        {field.type === 'date' ? (
                          <input
                            type="date"
                            value={formData.data[field.name] || ''}
                            onChange={(e) => updateFormDataField(field.name, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        ) : field.type === 'number' ? (
                          <input
                            type="number"
                            step="0.01"
                            value={formData.data[field.name] || ''}
                            onChange={(e) => updateFormDataField(field.name, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        ) : (
                          <input
                            type="text"
                            value={formData.data[field.name] || ''}
                            onChange={(e) => updateFormDataField(field.name, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Validation Errors */}
              {validationErrors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <h4 className="text-sm font-medium text-red-800 mb-2">
                    Missing required fields:
                  </h4>
                  <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                    {validationErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Form Actions */}
              <div className="flex justify-between pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false)
                    setFormData({ name: '', description: '', status: 'draft', data: {} })
                    setValidationErrors([])
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  disabled={isCreating || isValidating}
                >
                  Cancel
                </button>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={validateTemplateData}
                    className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 disabled:opacity-50"
                    disabled={isCreating || isValidating}
                  >
                    {isValidating ? 'Validating...' : 'Validate'}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                    disabled={isCreating || isValidating}
                  >
                    {isCreating ? 'Creating...' : 'Create Template'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
