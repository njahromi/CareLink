terraform {
  required_version = ">= 1.0"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
}

provider "azurerm" {
  features {}
}

# Resource Group
resource "azurerm_resource_group" "carelink" {
  name     = var.resource_group_name
  location = var.location
  tags     = var.tags
}

# Virtual Network
resource "azurerm_virtual_network" "main" {
  name                = "carelink-vnet"
  resource_group_name = azurerm_resource_group.carelink.name
  location            = azurerm_resource_group.carelink.location
  address_space       = ["10.0.0.0/16"]
  tags                = var.tags
}

# Subnets
resource "azurerm_subnet" "app" {
  name                 = "app-subnet"
  resource_group_name  = azurerm_resource_group.carelink.name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = ["10.0.1.0/24"]
}

resource "azurerm_subnet" "database" {
  name                 = "database-subnet"
  resource_group_name  = azurerm_resource_group.carelink.name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = ["10.0.2.0/24"]
}

# Application Gateway
resource "azurerm_public_ip" "appgw" {
  name                = "appgw-pip"
  resource_group_name = azurerm_resource_group.carelink.name
  location            = azurerm_resource_group.carelink.location
  allocation_method   = "Static"
  sku                 = "Standard"
  tags                = var.tags
}

resource "azurerm_application_gateway" "main" {
  name                = "carelink-appgw"
  resource_group_name = azurerm_resource_group.carelink.name
  location            = azurerm_resource_group.carelink.location

  sku {
    name     = "Standard_v2"
    tier     = "Standard_v2"
    capacity = 2
  }

  gateway_ip_configuration {
    name      = "gateway-ip-configuration"
    subnet_id = azurerm_subnet.app.id
  }

  frontend_port {
    name = "http-port"
    port = 80
  }

  frontend_port {
    name = "https-port"
    port = 443
  }

  frontend_ip_configuration {
    name                 = "frontend-ip-configuration"
    public_ip_address_id = azurerm_public_ip.appgw.id
  }

  backend_address_pool {
    name = "backend-pool"
  }

  backend_http_settings {
    name                  = "http-settings"
    cookie_based_affinity = "Disabled"
    port                  = 80
    protocol              = "Http"
    request_timeout       = 60
  }

  http_listener {
    name                           = "http-listener"
    frontend_ip_configuration_name = "frontend-ip-configuration"
    frontend_port_name             = "http-port"
    protocol                       = "Http"
  }

  request_routing_rule {
    name                       = "routing-rule"
    rule_type                  = "Basic"
    http_listener_name         = "http-listener"
    backend_address_pool_name  = "backend-pool"
    backend_http_settings_name = "http-settings"
    priority                   = 100
  }

  tags = var.tags
}

# App Service Plan
resource "azurerm_service_plan" "main" {
  name                = "carelink-app-plan"
  resource_group_name = azurerm_resource_group.carelink.name
  location            = azurerm_resource_group.carelink.location
  os_type             = "Linux"
  sku_name            = "P1v2"
  tags                = var.tags
}

# Backend App Service
resource "azurerm_linux_web_app" "backend" {
  name                = "carelink-backend-${random_string.suffix.result}"
  resource_group_name = azurerm_resource_group.carelink.name
  location            = azurerm_resource_group.carelink.location
  service_plan_id     = azurerm_service_plan.main.id

  site_config {
    application_stack {
      node_version = "18-lts"
    }
    always_on = true
  }

  app_settings = {
    "NODE_ENV"                    = "production"
    "PORT"                        = "3000"
    "MONGODB_URI"                 = azurerm_cosmosdb_account.main.connection_strings[0]
    "AZURE_SQL_CONNECTION_STRING" = "Server=${azurerm_mssql_server.main.fully_qualified_domain_name};Database=${azurerm_mssql_database.main.name};Authentication=Active Directory Default;"
    "FHIR_SERVER_URL"             = "https://hapi.fhir.org/baseR4"
    "SMART_CLIENT_ID"             = var.smart_client_id
    "SMART_CLIENT_SECRET"         = var.smart_client_secret
    "JWT_SECRET"                  = random_password.jwt_secret.result
    "FRONTEND_URL"                = "https://${azurerm_linux_web_app.frontend.default_hostname}"
  }

  tags = var.tags
}

# Frontend App Service
resource "azurerm_linux_web_app" "frontend" {
  name                = "carelink-frontend-${random_string.suffix.result}"
  resource_group_name = azurerm_resource_group.carelink.name
  location            = azurerm_resource_group.carelink.location
  service_plan_id     = azurerm_service_plan.main.id

  site_config {
    application_stack {
      node_version = "18-lts"
    }
    always_on = true
  }

  app_settings = {
    "VITE_API_BASE_URL"     = "https://${azurerm_linux_web_app.backend.default_hostname}/api"
    "VITE_FHIR_SERVER_URL"  = "https://hapi.fhir.org/baseR4"
    "VITE_SMART_CLIENT_ID"  = var.smart_client_id
  }

  tags = var.tags
}

# Azure SQL Database
resource "azurerm_mssql_server" "main" {
  name                         = "carelink-sql-${random_string.suffix.result}"
  resource_group_name          = azurerm_resource_group.carelink.name
  location                     = azurerm_resource_group.carelink.location
  version                      = "12.0"
  administrator_login          = var.sql_admin_username
  administrator_login_password = random_password.sql_password.result
  tags                         = var.tags
}

resource "azurerm_mssql_database" "main" {
  name           = "carelink-db"
  server_id      = azurerm_mssql_server.main.id
  collation      = "SQL_Latin1_General_CP1_CI_AS"
  license_type   = "LicenseIncluded"
  max_size_gb    = 2
  sku_name       = "Basic"
  tags           = var.tags
}

# Cosmos DB
resource "azurerm_cosmosdb_account" "main" {
  name                = "carelink-cosmos-${random_string.suffix.result}"
  location            = azurerm_resource_group.carelink.location
  resource_group_name = azurerm_resource_group.carelink.name
  offer_type          = "Standard"
  kind                = "MongoDB"

  enable_automatic_failover = true

  capabilities {
    name = "EnableMongo"
  }

  consistency_policy {
    consistency_level = "Session"
  }

  geo_location {
    location          = azurerm_resource_group.carelink.location
    failover_priority = 0
  }

  tags = var.tags
}

resource "azurerm_cosmosdb_mongo_database" "main" {
  name                = "carelink"
  resource_group_name = azurerm_cosmosdb_account.main.resource_group_name
  account_name        = azurerm_cosmosdb_account.main.name
}

# Service Bus
resource "azurerm_servicebus_namespace" "main" {
  name                = "carelink-sb-${random_string.suffix.result}"
  location            = azurerm_resource_group.carelink.location
  resource_group_name = azurerm_resource_group.carelink.name
  sku                 = "Standard"
  capacity            = 1
  tags                = var.tags
}

resource "azurerm_servicebus_queue" "health_events" {
  name         = "health-events"
  namespace_id = azurerm_servicebus_namespace.main.id

  enable_partitioning = true
  max_size_in_megabytes = 5120
}

# Application Insights
resource "azurerm_application_insights" "main" {
  name                = "carelink-insights"
  location            = azurerm_resource_group.carelink.location
  resource_group_name = azurerm_resource_group.carelink.name
  application_type    = "web"
  tags                = var.tags
}

# Random resources
resource "random_string" "suffix" {
  length  = 6
  special = false
  upper   = false
}

resource "random_password" "sql_password" {
  length  = 16
  special = true
}

resource "random_password" "jwt_secret" {
  length  = 32
  special = true
}

# Outputs
output "backend_url" {
  value = "https://${azurerm_linux_web_app.backend.default_hostname}"
}

output "frontend_url" {
  value = "https://${azurerm_linux_web_app.frontend.default_hostname}"
}

output "application_gateway_url" {
  value = azurerm_public_ip.appgw.ip_address
}

output "cosmos_db_connection_string" {
  value     = azurerm_cosmosdb_account.main.connection_strings[0]
  sensitive = true
}

output "sql_server_fqdn" {
  value = azurerm_mssql_server.main.fully_qualified_domain_name
} 