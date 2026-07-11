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

        public async Task<string> SuggestReplyAsync(string content, string currentUserName, string currentUserRole, CancellationToken cancellationToken = default)
        {
            var prompt = $@"Bạn là AI đóng vai trò '{currentUserRole}' tại công ty với tên là '{currentUserName}'.
Hotline của công ty là: 0123456789.

Nhiệm vụ của bạn là đọc thông tin Ticket dưới đây và soạn thảo một phản hồi hỗ trợ khách hàng.
Yêu cầu bắt buộc:
1. Trả lời bằng tiếng Việt, giọng văn chuyên nghiệp, lịch sự, đồng cảm.
2. NẾU tiêu đề và mô tả ticket không có ý nghĩa (ví dụ: chỉ toàn ký tự 'a', hoặc chuỗi ngẫu nhiên), hãy phản hồi theo đúng form mẫu sau (KHÔNG dùng ký tự in đậm như dấu sao):

Xin chào Quý khách,

Lời đầu tiên, em xin gửi lời chào trân trọng và cảm ơn Quý khách đã liên hệ với bộ phận Chăm sóc khách hàng của chúng em.

Em đã nhận được yêu cầu hỗ trợ từ Quý khách. Tuy nhiên, em nhận thấy phần tiêu đề và mô tả chi tiết của yêu cầu hiện đang hiển thị các ký tự mặc định (hoặc không rõ ràng). Em hiểu rằng có thể đã có một sự cố kỹ thuật ngoài ý muốn xảy ra trong quá trình Quý khách gửi thông tin, hoặc đây là một thao tác thử nghiệm của Quý khách.

Để em có thể hiểu rõ vấn đề và hỗ trợ Quý khách một cách nhanh chóng, chính xác nhất, Quý khách vui lòng phản hồi trực tiếp vào thư này và chia sẻ thêm cho em một số thông tin sau nhé:

1. Vấn đề hoặc câu hỏi cụ thể mà Quý khách đang cần hỗ trợ là gì ạ?
2. Hình ảnh hoặc video ảnh chụp màn hình mô tả lỗi (nếu có).
3. Thông tin tài khoản hoặc Mã đơn hàng/Mã khách hàng liên quan (nếu có).

Ngay khi nhận được phản hồi từ Quý khách, em sẽ lập tức kiểm tra và xử lý ngay cho mình. 

Sự hài lòng của Quý khách là ưu tiên hàng đầu của chúng em. Rất mong nhận được phản hồi từ Quý khách!

Chúc Quý khách một ngày tốt lành và nhiều niềm vui.

Trân trọng,

{currentUserName}
Bộ phận {currentUserRole}
Hotline: 0123456789 | Website: https://smarthelpdesk.com

3. NẾU ticket CÓ nội dung rõ ràng, hãy trả lời bình thường nhưng phần chữ ký cuối cùng bắt buộc phải giống như trên (tên, role, hotline).
4. TUYỆT ĐỐI KHÔNG SỬ DỤNG markdown in đậm (dấu **) ở bất kỳ đâu trong câu trả lời.

Thông tin Ticket:
{content}";
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
