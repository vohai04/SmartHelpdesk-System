using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using SmartHelpdesk.Application.Interfaces;

namespace SmartHelpdesk.Infrastructure.Services
{
    public class GeminiAiService : IAiService
    {
        private readonly HttpClient _httpClient;
        private readonly string _apiKey;
        private readonly string _modelUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent";

        public GeminiAiService(HttpClient httpClient, IConfiguration configuration)
        {
            _httpClient = httpClient;
            _apiKey = configuration["Gemini:ApiKey"];
        }

        public async Task<string> AnalyzeSentimentAsync(string content, CancellationToken cancellationToken = default)
        {
            var prompt = $"Phân tích cảm xúc của khách hàng trong ticket sau đây. Chỉ trả về 1 trong 4 từ sau: Tức giận, Bình thường, Vui vẻ, Đang vội.\n\n{content}";
            return await GenerateContentAsync(prompt, cancellationToken);
        }

        public async Task<string> SuggestReplyAsync(string content, CancellationToken cancellationToken = default)
        {
            var prompt = $"Đóng vai là nhân viên hỗ trợ khách hàng chuyên nghiệp, hãy soạn một câu trả lời lịch sự, đồng cảm và đưa ra hướng giải quyết dựa trên thông tin ticket sau đây. Viết bằng tiếng Việt.\n\n{content}";
            return await GenerateContentAsync(prompt, cancellationToken);
        }

        public async Task<string> DeterminePriorityAsync(string title, string description, CancellationToken cancellationToken = default)
        {
            var prompt = $@"Bạn là hệ thống phân tích mức độ ưu tiên của vé hỗ trợ IT. Dựa trên tiêu đề và mô tả, hãy đánh giá mức độ khẩn cấp và trả về CHỈ 1 TỪ duy nhất là một trong các giá trị sau: Low, Medium, High, Urgent. Không trả về thêm bất kỳ ký tự nào khác.

Tiêu đề: {title}
Mô tả: {description}";
            return await GenerateContentAsync(prompt, cancellationToken);
        }

        private async Task<string> GenerateContentAsync(string prompt, CancellationToken cancellationToken)
        {
            if (string.IsNullOrEmpty(_apiKey))
                throw new Exception("Gemini API Key is not configured.");

            var requestUrl = $"{_modelUrl}?key={_apiKey}";
            
            var requestBody = new
            {
                contents = new[]
                {
                    new
                    {
                        parts = new[] { new { text = prompt } }
                    }
                }
            };

            var jsonContent = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync(requestUrl, jsonContent, cancellationToken);
            
            if (!response.IsSuccessStatusCode)
            {
                var errorResponse = await response.Content.ReadAsStringAsync(cancellationToken);
                throw new Exception($"Gemini API error ({response.StatusCode}): {errorResponse}");
            }

            var responseJson = await response.Content.ReadAsStringAsync(cancellationToken);
            using var document = JsonDocument.Parse(responseJson);

            try
            {
                var text = document.RootElement
                    .GetProperty("candidates")[0]
                    .GetProperty("content")
                    .GetProperty("parts")[0]
                    .GetProperty("text").GetString();

                return text?.Trim() ?? string.Empty;
            }
            catch
            {
                return "Không thể phân tích phản hồi từ AI.";
            }
        }
    }
}
