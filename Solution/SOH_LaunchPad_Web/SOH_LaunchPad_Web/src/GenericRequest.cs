using System;
using System.Net.Http;
using System.Linq;
using System.Web;
using System.Threading.Tasks;
using Newtonsoft.Json;
using System.Net.Http.Headers;

namespace SOH_LaunchPad_Web
{
    public class GenericRequest
    {
        private static readonly HttpClient client = new HttpClient();

        public static async Task<RequestResult> Post(string requestUri, HttpContent content)
        {
            content.Headers.ContentType = new MediaTypeHeaderValue("application/json");
            var response = await client.PostAsync(requestUri, content);

            string result = await response.Content.ReadAsStringAsync();

            if (response.IsSuccessStatusCode)
            {
                return JsonConvert.DeserializeObject<RequestResult>(result);
            }
            else
            {
                return new RequestResult() { Status = RequestResult.ResultStatus.Failure, Errmsg = response.ReasonPhrase };
            }
        }
    }
}