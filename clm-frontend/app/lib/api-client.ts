/**
 * Production-grade API Client
 * All real endpoints - NO mock data
 * Handles authentication, error handling, and all CLM operations
 */

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  status: number
}

export interface Contract {
  id: string
  title: string
  description?: string
  status: 'draft' | 'pending' | 'approved' | 'rejected'
  created_at: string
  updated_at: string
  value?: number
  created_by?: string
}

export interface ContractTemplate {
  id: string
  name: string
  contract_type: string
  description?: string
  r2_key?: string
  merge_fields?: string[]
  status: string
}

export interface Clause {
  id: string
  clause_id: string
  name: string
  version?: number
  contract_type: string
  content: string
  status: string
  is_mandatory?: boolean
  tags?: any
}

export interface ContractGenerateResponse {
  contract: any
  version: any
  mandatory_clauses: any[]
  clause_suggestions: Record<string, any>
  validation_errors: any[]
}

export interface ContractGenerateFromFileResponse {
  contract: any
  rendered_text: string
  raw_text: string
}

export interface TemplateFileResponse {
  success: boolean
  template_type: string
  filename: string
  content: string
  size: number
  display_name?: string
  description?: string
}

export interface FileTemplateItem {
  id: string
  filename: string
  name: string
  contract_type: string
  description?: string
  status: string
  created_at?: string
  updated_at?: string
  created_by_id?: string
  created_by_email?: string
}

export interface FileTemplateContentResponse {
  success: boolean
  filename: string
  name: string
  template_type: string
  content: string
  size: number
}

export interface Workflow {
  id: string
  name: string
  description?: string
  status: 'active' | 'inactive' | 'archived'
  steps: WorkflowStep[]
  created_at: string
}

export interface WorkflowStep {
  step_number: number
  name: string
  assigned_to: string[]
  action_type?: string
}

export interface ApprovalRequest {
  id: string
  entity_type: string
  entity_id: string
  requester_id: string
  status: 'pending' | 'approved' | 'rejected'
  comment?: string
  priority?: 'low' | 'normal' | 'high'
  created_at: string
  updated_at: string
}

export interface Notification {
  id: string
  type: string
  subject: string
  message: string
  read: boolean
  created_at: string
  action_url?: string
}

export interface SearchResult {
  id: string
  title: string
  entity_type: string
  content_preview: string
  relevance_score: number
}

export class ApiClient {
  private baseUrl: string
  private token: string | null = null
  private refreshToken: string | null = null

  private static readonly API_V1_PREFIX = '/api/v1'

  constructor(baseUrl: string = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000') {
    this.baseUrl = baseUrl
    this.loadTokens()
  }

  private loadTokens() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('access_token')
      this.refreshToken = localStorage.getItem('refresh_token')
    }
  }

  private setTokens(access: string, refresh?: string) {
    this.token = access
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', access)
      if (refresh) {
        this.refreshToken = refresh
        localStorage.setItem('refresh_token', refresh)
      }
    }
  }

  private clearTokens() {
    this.token = null
    this.refreshToken = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
    }
  }

  private async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) return false

    try {
      const response = await fetch(`${this.baseUrl}/api/auth/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ refresh: this.refreshToken }),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        return false
      }

      const access = (data as any)?.access
      const refresh = (data as any)?.refresh
      if (access) {
        this.setTokens(access, refresh)
        return true
      }

      return false
    } catch {
      return false
    }
  }

  private async request<T>(
    method: string,
    endpoint: string,
    data?: any,
    customHeaders?: Record<string, string>,
    allowRetry: boolean = true,
    options?: { auth?: boolean }
  ): Promise<ApiResponse<T>> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...customHeaders,
      }

      const useAuth = options?.auth !== false

      if (useAuth && this.token) {
        headers['Authorization'] = `Bearer ${this.token}`
      }

      const config: RequestInit = {
        method,
        headers,
        credentials: 'include',
      }

      if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        config.body = JSON.stringify(data)
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, config)

      if (response.status === 401) {
        if (useAuth && allowRetry && (await this.refreshAccessToken())) {
          return this.request(method, endpoint, data, customHeaders, false, options)
        }
        // Don't throw; let callers handle 401 explicitly.
        return {
          success: false,
          error: 'Unauthorized - Please log in again',
          status: 401,
        }
      }

      const responseData = await response.json().catch(() => ({}))

      if (!response.ok) {
        return {
          success: false,
          error: responseData.message || responseData.detail || 'Request failed',
          status: response.status,
        }
      }

      return {
        success: true,
        data: responseData,
        status: response.status,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        status: 0,
      }
    }
  }

  // ==================== AUTHENTICATION ====================
  async register(email: string, password: string, fullName: string): Promise<ApiResponse> {
    const response = await this.request('POST', '/api/auth/register/', {
      email,
      password,
      full_name: fullName,
    })

    if (response.success && (response.data as any)?.access) {
      this.setTokens((response.data as any).access, (response.data as any).refresh)
    }

    return response
  }

  async login(email: string, password: string): Promise<ApiResponse> {
    const response = await this.request('POST', '/api/auth/login/', {
      email,
      password,
    })

    if (response.success && (response.data as any)?.access) {
      this.setTokens((response.data as any).access, (response.data as any).refresh)
    }

    return response
  }

  async logout(): Promise<ApiResponse> {
    const response = await this.request('POST', '/api/auth/logout/', {})
    this.clearTokens()
    return response
  }

  async getCurrentUser(): Promise<ApiResponse> {
    return this.request('GET', '/api/auth/me/')
  }

  // ==================== CONTRACTS ====================
  async createContract(data: Partial<Contract>): Promise<ApiResponse<Contract>> {
    return this.request('POST', `${ApiClient.API_V1_PREFIX}/contracts/`, data)
  }

  async generateContract(params: {
    templateId: string
    structuredInputs?: Record<string, any>
    userInstructions?: string
    title?: string
    selectedClauses?: string[]
  }): Promise<ApiResponse<ContractGenerateResponse>> {
    return this.request('POST', `${ApiClient.API_V1_PREFIX}/contracts/generate/`, {
      template_id: params.templateId,
      structured_inputs: params.structuredInputs || {},
      user_instructions: params.userInstructions,
      title: params.title,
      selected_clauses: params.selectedClauses || [],
    })
  }

  async generateContractFromFile(params: {
    filename: string
    structuredInputs?: Record<string, any>
    userInstructions?: string
    title?: string
    selectedClauses?: string[]
  }): Promise<ApiResponse<ContractGenerateFromFileResponse>> {
    return this.request('POST', `${ApiClient.API_V1_PREFIX}/contracts/generate-from-file/`, {
      filename: params.filename,
      structured_inputs: params.structuredInputs || {},
      user_instructions: params.userInstructions,
      title: params.title,
      selected_clauses: params.selectedClauses || [],
    })
  }

  async getContracts(params?: Record<string, any>): Promise<ApiResponse> {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
    return this.request('GET', `${ApiClient.API_V1_PREFIX}/contracts/${queryString}`)
  }

  async getContractById(id: string): Promise<ApiResponse<Contract>> {
    return this.request('GET', `${ApiClient.API_V1_PREFIX}/contracts/${id}/`)
  }

  async updateContract(id: string, data: Partial<Contract>): Promise<ApiResponse<Contract>> {
    return this.request('PUT', `${ApiClient.API_V1_PREFIX}/contracts/${id}/`, data)
  }

  async deleteContract(id: string): Promise<ApiResponse> {
    return this.request('DELETE', `${ApiClient.API_V1_PREFIX}/contracts/${id}/`)
  }

  async cloneContract(id: string, newTitle: string): Promise<ApiResponse<Contract>> {
    return this.request('POST', `${ApiClient.API_V1_PREFIX}/contracts/${id}/clone/`, {
      title: newTitle,
    })
  }

  async getContractVersions(id: string): Promise<ApiResponse> {
    return this.request('GET', `${ApiClient.API_V1_PREFIX}/contracts/${id}/versions/`)
  }

  async createContractVersion(
    id: string,
    changeSummary: string,
    selectedClauses?: string[]
  ): Promise<ApiResponse> {
    return this.request('POST', `${ApiClient.API_V1_PREFIX}/contracts/${id}/versions/`, {
      change_summary: changeSummary,
      selected_clauses: selectedClauses || [],
    })
  }

  async getContractStatistics(): Promise<ApiResponse> {
    return this.request('GET', `${ApiClient.API_V1_PREFIX}/contracts/statistics/`)
  }

  async getRecentContracts(limit: number = 5): Promise<ApiResponse> {
    return this.request('GET', `${ApiClient.API_V1_PREFIX}/contracts/recent/?limit=${limit}`)
  }

  // ==================== CLAUSES ====================
  async getClauses(params?: Record<string, any>): Promise<ApiResponse<Clause[]>> {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
    return this.request('GET', `${ApiClient.API_V1_PREFIX}/clauses/${queryString}`)
  }

  // ==================== TEMPLATES ====================
  async createTemplate(data: Partial<ContractTemplate>): Promise<ApiResponse<ContractTemplate>> {
    return this.request('POST', `${ApiClient.API_V1_PREFIX}/contract-templates/`, data)
  }

  async getTemplates(): Promise<ApiResponse> {
    return this.request('GET', `${ApiClient.API_V1_PREFIX}/contract-templates/`)
  }

  async getTemplateById(id: string): Promise<ApiResponse<ContractTemplate>> {
    return this.request('GET', `${ApiClient.API_V1_PREFIX}/contract-templates/${id}/`)
  }

  async updateTemplate(
    id: string,
    data: Partial<ContractTemplate>
  ): Promise<ApiResponse<ContractTemplate>> {
    return this.request('PUT', `${ApiClient.API_V1_PREFIX}/contract-templates/${id}/`, data)
  }

  async deleteTemplate(id: string): Promise<ApiResponse> {
    return this.request('DELETE', `${ApiClient.API_V1_PREFIX}/contract-templates/${id}/`)
  }

  async getTemplateFile(templateType: string): Promise<ApiResponse<TemplateFileResponse>> {
    return this.request('GET', `${ApiClient.API_V1_PREFIX}/templates/files/${templateType}/`, undefined, undefined, true, {
      auth: false,
    })
  }

  // ==================== FILE-BASED TEMPLATES (NO DB) ====================
  async listTemplateFiles(): Promise<ApiResponse<{ success: boolean; count: number; results: FileTemplateItem[] }>> {
    return this.request('GET', `${ApiClient.API_V1_PREFIX}/templates/files/`, undefined, undefined, true, {
      auth: false,
    })
  }

  async createTemplateFile(params: { name?: string; filename?: string; description?: string; content: string }): Promise<ApiResponse<{ success: boolean; template: FileTemplateItem }>> {
    return this.request('POST', `${ApiClient.API_V1_PREFIX}/templates/files/`, params)
  }

  async listMyTemplateFiles(): Promise<ApiResponse<{ success: boolean; count: number; results: FileTemplateItem[] }>> {
    return this.request('GET', `${ApiClient.API_V1_PREFIX}/templates/files/mine/`)
  }

  async getTemplateFileContent(filename: string): Promise<ApiResponse<FileTemplateContentResponse>> {
    const safe = encodeURIComponent(filename)
    return this.request('GET', `${ApiClient.API_V1_PREFIX}/templates/files/content/${safe}/`, undefined, undefined, true, {
      auth: false,
    })
  }

  // ==================== WORKFLOWS ====================
  async createWorkflow(data: Partial<Workflow>): Promise<ApiResponse<Workflow>> {
    return this.request('POST', `${ApiClient.API_V1_PREFIX}/workflows/`, data)
  }

  async getWorkflows(): Promise<ApiResponse> {
    return this.request('GET', `${ApiClient.API_V1_PREFIX}/workflows/`)
  }

  async getWorkflowById(id: string): Promise<ApiResponse<Workflow>> {
    return this.request('GET', `${ApiClient.API_V1_PREFIX}/workflows/${id}/`)
  }

  async updateWorkflow(id: string, data: Partial<Workflow>): Promise<ApiResponse<Workflow>> {
    return this.request('PUT', `${ApiClient.API_V1_PREFIX}/workflows/${id}/`, data)
  }

  async deleteWorkflow(id: string): Promise<ApiResponse> {
    return this.request('DELETE', `${ApiClient.API_V1_PREFIX}/workflows/${id}/`)
  }

  async getWorkflowInstances(workflowId: string): Promise<ApiResponse> {
    return this.request('GET', `${ApiClient.API_V1_PREFIX}/workflows/${workflowId}/instances/`)
  }

  // ==================== APPROVALS ====================
  async createApproval(data: Partial<ApprovalRequest>): Promise<ApiResponse<ApprovalRequest>> {
    return this.request('POST', `${ApiClient.API_V1_PREFIX}/approvals/`, data)
  }

  async getApprovals(params?: Record<string, any>): Promise<ApiResponse> {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
    return this.request('GET', `${ApiClient.API_V1_PREFIX}/approvals/${queryString}`)
  }

  async getApprovalById(id: string): Promise<ApiResponse<ApprovalRequest>> {
    return this.request('GET', `${ApiClient.API_V1_PREFIX}/approvals/${id}/`)
  }

  async updateApproval(
    id: string,
    data: Partial<ApprovalRequest>
  ): Promise<ApiResponse<ApprovalRequest>> {
    return this.request('PUT', `${ApiClient.API_V1_PREFIX}/approvals/${id}/`, data)
  }

  async approveRequest(id: string, comment?: string): Promise<ApiResponse> {
    return this.request('PUT', `${ApiClient.API_V1_PREFIX}/approvals/${id}/`, {
      status: 'approved',
      comment,
    })
  }

  async rejectRequest(id: string, reason?: string): Promise<ApiResponse> {
    return this.request('PUT', `${ApiClient.API_V1_PREFIX}/approvals/${id}/`, {
      status: 'rejected',
      comment: reason,
    })
  }

  // ==================== NOTIFICATIONS ====================
  async getNotifications(params?: Record<string, any>): Promise<ApiResponse> {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
    return this.request('GET', `/api/notifications/${queryString}`)
  }

  async createNotification(data: any): Promise<ApiResponse<Notification>> {
    return this.request('POST', '/api/notifications/', data)
  }

  async markNotificationAsRead(id: string): Promise<ApiResponse> {
    return this.request('PUT', `/api/notifications/${id}/`, { read: true })
  }

  // ==================== SEARCH ====================
  async search(query: string, params?: Record<string, any>): Promise<ApiResponse> {
    const fullParams = { q: query, ...params }
    const queryString = '?' + new URLSearchParams(fullParams).toString()
    return this.request('GET', `/api/search/${queryString}`)
  }

  async semanticSearch(query: string): Promise<ApiResponse> {
    return this.request('GET', `/api/search/semantic/?q=${encodeURIComponent(query)}`)
  }

  async advancedSearch(data: any): Promise<ApiResponse> {
    return this.request('POST', '/api/search/advanced/', data)
  }

  async getSearchSuggestions(query: string): Promise<ApiResponse> {
    return this.request('GET', `/api/search/suggestions/?q=${encodeURIComponent(query)}`)
  }

  // ==================== DOCUMENTS ====================
  async listDocuments(): Promise<ApiResponse> {
    return this.request('GET', '/api/documents/')
  }

  async getRepository(): Promise<ApiResponse> {
    return this.request('GET', '/api/repository/')
  }

  async getRepositoryFolders(): Promise<ApiResponse> {
    return this.request('GET', '/api/repository/folders/')
  }

  async createFolder(name: string, parentId?: string): Promise<ApiResponse> {
    return this.request('POST', '/api/repository/folders/', {
      name,
      parent_id: parentId,
    })
  }

  // ==================== METADATA ====================
  async createMetadataField(data: any): Promise<ApiResponse> {
    return this.request('POST', '/api/metadata/fields/', data)
  }

  async getMetadataFields(): Promise<ApiResponse> {
    return this.request('GET', '/api/metadata/fields/')
  }

  // ==================== HEALTH ====================
  async getHealth(): Promise<ApiResponse> {
    return this.request('GET', `${ApiClient.API_V1_PREFIX}/health/`)
  }
}

// Singleton instance
export const apiClient = new ApiClient()
