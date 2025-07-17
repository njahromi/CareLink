variable "resource_group_name" {
  description = "Name of the resource group"
  type        = string
  default     = "carelink-rg"
}

variable "location" {
  description = "Azure region for resources"
  type        = string
  default     = "East US"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "smart_client_id" {
  description = "SMART on FHIR client ID"
  type        = string
  default     = "carelink-client"
}

variable "smart_client_secret" {
  description = "SMART on FHIR client secret"
  type        = string
  default     = "carelink-secret"
  sensitive   = true
}

variable "sql_admin_username" {
  description = "SQL Server administrator username"
  type        = string
  default     = "carelinkadmin"
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default = {
    Environment = "dev"
    Project     = "CareLink"
    ManagedBy   = "Terraform"
  }
}

variable "app_service_plan_sku" {
  description = "App Service Plan SKU"
  type        = string
  default     = "P1v2"
}

variable "sql_database_sku" {
  description = "SQL Database SKU"
  type        = string
  default     = "Basic"
}

variable "cosmos_db_offer_type" {
  description = "Cosmos DB offer type"
  type        = string
  default     = "Standard"
}

variable "service_bus_sku" {
  description = "Service Bus SKU"
  type        = string
  default     = "Standard"
}

variable "application_gateway_sku" {
  description = "Application Gateway SKU"
  type        = string
  default     = "Standard_v2"
}

variable "node_version" {
  description = "Node.js version for App Service"
  type        = string
  default     = "18-lts"
} 