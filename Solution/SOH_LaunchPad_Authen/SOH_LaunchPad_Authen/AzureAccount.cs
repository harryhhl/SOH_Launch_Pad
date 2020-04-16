using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace SOH_LaunchPad_Authen
{
    public class IdToken
    {
        public string aud { get; set; }
        public string iss { get; set; }
        public int iat { get; set; }
        public int nbf { get; set; }
        public int exp { get; set; }
        public string aio { get; set; }
        public string name { get; set; }
        public string nonce { get; set; }
        public string oid { get; set; }
        public string preferred_username { get; set; }
        public string sub { get; set; }
        public string tid { get; set; }
        public string uti { get; set; }
        public string ver { get; set; }
    }

    public class AzureAccount
    {
        public string accountIdentifier { get; set; }
        public string homeAccountIdentifier { get; set; }
        public string userName { get; set; }
        public string name { get; set; }
        public IdToken idToken { get; set; }
        public string environment { get; set; }
    }
}