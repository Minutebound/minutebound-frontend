import Link from 'next/link';

const categories = [
  { name: 'City Breaks', image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=400' },
  { name: 'Coastal Escapes', image: 'https://images.unsplash.com/photo-1533106497176-45ae19e68ba2?auto=format&fit=crop&w=400' },
  { name: 'Mountain Retreats', image: 'https://images.unsplash.com/photo-1546146477-15a5ed03ea32?auto=format&fit=crop&w=400' },
  { name: 'Hidden Gems', image: 'https://images.unsplash.com/photo-1474044159687-1ee9f3a51722?auto=format&fit=crop&w=400' },
];

export default function DestinationCategories() {
  return (
    <section className="py-12">
      <h2 className="text-3xl font-bold mb-6">Explore by Vibe</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {categories.map((cat) => (
          <Link href={`/destinations?category=${encodeURIComponent(cat.name)}`} key={cat.name}>
            <div className="relative h-48 rounded-xl overflow-hidden cursor-pointer group">
              <img src={cat.image} alt={cat.name} className="object-cover w-full h-full group-hover:scale-105 transition-transform" />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <span className="text-white font-bold text-xl drop-shadow-md">{cat.name}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}