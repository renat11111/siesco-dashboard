package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"os"
	"time"

	"github.com/joho/godotenv"
)

var (
	username string
	password string
	dbName   string
)

// App struct
type App struct {
	ctx        context.Context
	Logger     *slog.Logger
	HTTPClient *http.Client
}

// ApiResponse is the top-level structure from the 1C API
type ApiResponse struct {
	Status   StatusResponse `json:"status"`
	Response ResponseData   `json:"response"`
}

// StatusResponse holds the status of the API call
type StatusResponse struct {
	ErrorCode int    `json:"errorCode"`
	Message   string `json:"message"`
}

// ResponseData is a wrapper for the array of cash data
type ResponseData struct {
	Data []CashData `json:"data"`
}

// CashData represents a single data point from the 1C API
type CashData struct {
	Sum              float64 `json:"sum"`
	SumCurrency      float64 `json:"sum_currency"`
	Date             string  `json:"date"`
	CashRegisterName string  `json:"cash_register_name"`
	Currency         string  `json:"currency"`
	USDRate          float64 `json:"USD_rate"`
	EURRate          float64 `json:"EUR_rate"`
	SumUSD           float64 `json:"sumUSD"`
	SumEUR           float64 `json:"sumEUR"`
}

// BankData represents a single data point from the 1C API
type BankData struct {
	Sum              float64 `json:"sum"`
	SumCurrency      float64 `json:"sum_currency"`
	Date             string  `json:"date"`
	CashID           string  `json:"cashID"`
	CashRegisterName string  `json:"cash_register_name"`
	Company          string  `json:"Company"`
	CompanyID        string  `json:"companyID"`
	Currency         string  `json:"currency"`
	CurrencyID       string  `json:"currencyID"`
	USDRate          float64 `json:"USD_rate"`
	EURRate          float64 `json:"EUR_rate"`
	SumUSD           float64 `json:"sumUSD"`
	SumEUR           float64 `json:"sumEUR"`
}

// BankApiResponse is the top-level structure for bank data from the 1C API
type BankApiResponse struct {
	Status   StatusResponse   `json:"status"`
	Response BankResponseData `json:"response"`
}

// BankResponseData is a wrapper for the array of bank data
type BankResponseData struct {
	Data []BankData `json:"data"`
}

// NewApp creates a new App application struct
func NewApp() *App {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	return &App{
		Logger: logger,
		HTTPClient: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	if err := loadEnvVariables(); err != nil {
		a.Logger.Warn("Could not load .env file. Falling back to environment variables.", "error", err)
	}
}

func loadEnvVariables() error {
	err := godotenv.Load()
	if err != nil {
		return err
	}

	username = os.Getenv("HTTP_USERNAME")
	password = os.Getenv("HTTP_PASSWORD")
	dbName = os.Getenv("DB_NAME")
	return nil
}

func (a *App) fetchData(endpoint string, requestBody map[string]interface{}, responseType interface{}) error {
    url := fmt.Sprintf("http://localhost/%s/hs/Mobile/%s", dbName, endpoint)
    bodyBytes, err := json.Marshal(requestBody)
    if err != nil {
        return fmt.Errorf("failed to marshal request body: %w", err)
    }
    req, err := http.NewRequestWithContext(a.ctx, "POST", url, bytes.NewBuffer(bodyBytes))
    if err != nil {
        return fmt.Errorf("failed to create request: %w", err)
    }
    req.SetBasicAuth(username, password)
    req.Header.Set("Content-Type", "application/json")
    
    resp, err := a.HTTPClient.Do(req)
    if err != nil {
		a.Logger.Error("Failed to send request", "error", err, "url", url)
        return fmt.Errorf("failed to send request: %w", err)
    }
    defer resp.Body.Close()
    
    respBody, err := io.ReadAll(resp.Body)
    if err != nil {
		a.Logger.Error("Failed to read response body", "error", err, "url", url)
        return fmt.Errorf("failed to read response body: %w", err)
    }
    if resp.StatusCode != http.StatusOK {
		// In a production environment, you should be careful about logging the full response body.
		a.Logger.Error("Failed to fetch data", "status_code", resp.StatusCode, "body", string(respBody), "url", url)
        return fmt.Errorf("failed to fetch data: status code %d, body: %s", resp.StatusCode, string(respBody))
    }
    
    return json.Unmarshal(respBody, responseType)
}

// GetCashData fetches cash data from the 1C service
func (a *App) GetCashData() ([]CashData, error) {
    var apiResponse ApiResponse
    err := a.fetchData("Cash", map[string]interface{}{"type": "Cash", "number_of_days": 0}, &apiResponse)
    if err != nil {
        return nil, err
    }
    if apiResponse.Status.ErrorCode != 0 {
		a.Logger.Error("1C API Error", "error_code", apiResponse.Status.ErrorCode, "message", apiResponse.Status.Message)
        return nil, fmt.Errorf("1C API Error: %s", apiResponse.Status.Message)
    }
	a.Logger.Info("Fetched cash data", "items", len(apiResponse.Response.Data))
    return apiResponse.Response.Data, nil
}

// GetBankData fetches bank data from the 1C service
func (a *App) GetBankData() ([]BankData, error) {
    var apiResponse BankApiResponse
    err := a.fetchData("Bank", map[string]interface{}{"type": "Bank", "number_of_days": 0}, &apiResponse)
    if err != nil {
        return nil, err
    }
    if apiResponse.Status.ErrorCode != 0 {
		a.Logger.Error("1C API Error", "error_code", apiResponse.Status.ErrorCode, "message", apiResponse.Status.Message)
        return nil, fmt.Errorf("1C API Error: %s", apiResponse.Status.Message)
    }
	a.Logger.Info("Fetched bank data", "items", len(apiResponse.Response.Data))
    return apiResponse.Response.Data, nil
}