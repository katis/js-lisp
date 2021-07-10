#[macro_export]
macro_rules! map (
    { $($key:expr => $value:expr),+ } => {
        {
            let mut m = ::std::collections::HashMap::new();
            $(
                m.insert($key, $value);
            )+
            m
        }
     };
);


#[macro_export]
macro_rules! set (
    { $($value:expr),+ } => {
        {
            let mut m = ::std::collections::HashSet::new();
            $(
                m.insert($value);
            )+
            m
        }
     };
);

pub fn hash_cyrb53(input: &str) -> i64 {
    let seed = 0;
    let mut h1 = 0xdeadbeef ^ seed;
    let mut h2 = 0x41c6ce57 ^ seed;

    for ch in input.chars().map(|ch| ch as u32) {
        h1 = (h1 ^ ch) * 2654435761;
        h2 = (h2 ^ ch) * 1597334677;
    }
    h1 = ((h1 ^ (h1 >> 16)) * 2246822507) ^ ((h2 ^ (h2 >> 13)) * 3266489909);
    h2 = ((h2 ^ (h2 >> 16)) * 2246822507) ^ ((h1 ^ (h1 >> 13)) * 3266489909);

    let h1 = (h1 >> 0) as i64;
    let h2 = (2097151 & h2) as i64;
    4294967296 * h2 + h1
}
