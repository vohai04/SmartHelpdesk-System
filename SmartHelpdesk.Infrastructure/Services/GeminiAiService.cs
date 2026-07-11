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

        public async Task<string> SuggestReplyAsync(string ticketTitle, string ticketDescription, string chatHistory, string currentUserName, string currentUserRole, CancellationToken cancellationToken = default)
        {
            var prompt = $@"Bạn là AI đóng vai trò '{currentUserRole}' tại công ty với tên là '{currentUserName}'.
Hotline của công ty là: 0123456789.

Nhiệm vụ của bạn là đọc thông tin Ticket và Lịch sử trò chuyện dưới đây để soạn thảo một phản hồi hỗ trợ khách hàng tiếp theo.
Yêu cầu bắt buộc:
1. Trả lời bằng tiếng Việt, giọng văn chuyên nghiệp, lịch sự, đồng cảm.
2. Dựa vào những gì Khách hàng và Agent đã trao đổi trong Lịch sử trò chuyện để đưa ra câu trả lời hợp lý (không lặp lại những gì đã nói, trả lời thẳng vào vấn đề tiếp theo).
3. NẾU tiêu đề và mô tả ticket không có ý nghĩa (chỉ toàn ký tự 'a'), và chưa có tin nhắn nào, hãy phản hồi yêu cầu cung cấp thêm thông tin.
4. Phần chữ ký cuối cùng bắt buộc phải có:
{currentUserName}
Bộ phận {currentUserRole}
Hotline: 0123456789 | Website: https://smarthelpdesk.com
5. TUYỆT ĐỐI KHÔNG SỬ DỤNG markdown in đậm (dấu **) ở bất kỳ đâu trong câu trả lời.

Thông tin Ticket:
Tiêu đề: {ticketTitle}
Mô tả: {ticketDescription}

Lịch sử trò chuyện:
{chatHistory}";
            return await GenerateContentAsync(prompt, false, cancellationToken);
        }

        public async Task<AiTriageResult> AnalyzeTicketTriageAsync(string title, string description, CancellationToken cancellationToken = default)
        {
            var prompt = $@"Bạn là hệ thống phân loại vé hỗ trợ IT tự động. Hãy phân tích Tiêu đề và Mô tả của vé dưới đây và trả về định dạng JSON với 3 trường sau:
1. ""priority"": Đánh giá mức độ khẩn cấp, CHỈ chọn 1 trong các giá trị: ""Low"", ""Medium"", ""High"", ""Urgent"".
2. ""sentiment"": Phân tích cảm xúc của khách hàng, CHỈ chọn 1 trong các giá trị: ""Tức giận"", ""Bình thường"", ""Vui vẻ"", ""Đang vội"".
3. ""summary"": Tóm tắt ngắn gọn vấn đề của khách hàng trong 1-2 câu tiếng Việt.

Tiêu đề: {title}
Mô tả: {description}";

            var jsonResult = await GenerateContentAsync(prompt, true, cancellationToken);
            
            try
            {
                var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                var result = JsonSerializer.Deserialize<AiTriageResult>(jsonResult, options);
                return result ?? new AiTriageResult();
            }
            catch
            {
                return new AiTriageResult(); // Fallback
            }
        }

        private async Task<string> GenerateContentAsync(string prompt, bool expectJson, CancellationToken cancellationToken)
        {
            if (string.IsNullOrEmpty(_apiKey))
                throw new Exception("Gemini API Key is not configured.");

            var requestUrl = $"{_modelUrl}?key={_apiKey}";
            
            object requestBody;
            if (expectJson)
            {
                requestBody = new
                {
                    contents = new[] { new { parts = new[] { new { text = prompt } } } },
                    generationConfig = new { response_mime_type = "application/json" }
                };
            }
            else
            {
                requestBody = new
                {
                    contents = new[] { new { parts = new[] { new { text = prompt } } } }
                };
            }

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
