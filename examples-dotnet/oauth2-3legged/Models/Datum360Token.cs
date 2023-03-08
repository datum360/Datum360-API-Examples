namespace oauth2_3legged.Models
{
    public class Datum360Token
    {
        /// <summary>
        /// URL of the system being authenticated against
        /// </summary>
        public string systemUrl { get; set; }
        /// <summary>
        /// Currently authenticated user
        /// </summary>
        public User user { get; set; }
        /// <summary>
        /// Array of capabilities, can be for multiple systems e.g cls360, pim360, ddm360
        /// </summary>
        public Capability[] capabilities { get; set; }
    }
}
